import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { encrypt } from '@metamask/eth-sig-util'
import Deb0x from "../ethereum/deb0x"
import { create } from 'ipfs-http-client'
import SendIcon from '@mui/icons-material/Send';
import {
    Box, TextField, Button
} from '@mui/material';
const deb0xAddress = "0x218c10BAb451BE6A897db102b2f608bC7D3441a0";
const ethUtil = require('ethereumjs-util')


const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'http'
})

export function Encrypt(): any {
    const { account, library } = useWeb3React()
    const [encryptionKey, setKey] = useState('')
    const [textToEncrypt, setTextToEncrypt] = useState('')
    const [cipheredText, setCipheredText] = useState('')
    const [encryptionKeyInitialized, setEncryptionKeyInitialized] = useState('')
    const [senderAddress, setSenderAddress] = useState('')

    useEffect(() => {
        if (!encryptionKeyInitialized) {
            getPublicEncryptionKey()
        }
    }, []);

    async function encryptText(messageToEncrypt: any, destinationAddress: any) {
        const signer = await library.getSigner(0);

        const deb0xContract = Deb0x(signer, deb0xAddress);

        const destinationAddressEncryptionKey = await deb0xContract.getKey(destinationAddress);
        const encryptedMessage = ethUtil.bufferToHex(
            Buffer.from(
                JSON.stringify(
                    encrypt({
                        publicKey: destinationAddressEncryptionKey,
                        data: messageToEncrypt,
                        version: 'x25519-xsalsa20-poly1305'
                    }
                    )
                ),
                'utf8'
            )
        )

        const message = await client.add(encryptedMessage)

        console.log(message)

        const tx = await deb0xContract.send(destinationAddress, message.path)

        setCipheredText(encryptedMessage)
    }

    async function initializeDeb0x() {
        const signer = await library.getSigner(0);

        const deb0xContract = Deb0x(signer, deb0xAddress);

        const tx = await deb0xContract.setKey(encryptionKey);

        const receipt = await tx.wait();

        return receipt.transactionHash;
    }

    async function getEncryptionKey() {
        library.provider.request({
            method: 'eth_getEncryptionPublicKey',
            params: [account],
        })
            .then((result: any) => {
                setKey(result);
            });
    }

    const getPublicEncryptionKey = async () => {
        const deb0xContract = Deb0x(library, deb0xAddress)
        const key = await deb0xContract.getKey(account)
        console.log(key)
        console.log(encryptionKey)
        setEncryptionKeyInitialized(key)
    }


    return (
        <>
            {/* <div id="encrypt-message-form">

                <input
                    className="form-control"
                    type="text"
                    placeholder="Destination Address"
                    id="senderAddress"
                    value={senderAddress}
                    onChange={e => setSenderAddress(e.target.value)}
                />


            </div>

            <br />

            <button
                className="btn btn-primary btn-lg btn-block mb-3"
                id="encryptButton"
                disabled={textToEncrypt == '' || senderAddress == ''}
                onClick={() => encryptText(textToEncrypt, senderAddress)}

            >
                Encrypt
            </button> */}

            <Box
                component="form"
                sx={{
                    '& .MuiTextField-root': { m: 1, width: '150ch' },
                }}
                noValidate
                autoComplete="off"
            >
                <TextField id="standard-basic" label="Destination Address" variant="standard"
                    sx={{
                        '& > :not(style)': { m: 1, width: '44ch' },
                    }}
                    value={senderAddress}
                    onChange={e => setSenderAddress(e.target.value)}
                />

                <TextField
                    id="outlined-multiline-static"
                    label="Message"
                    multiline
                    rows={10}
                    value={textToEncrypt}
                    onChange={e => setTextToEncrypt(e.target.value)}
                />
                <br />
                <Button variant="contained" endIcon={<SendIcon />}
                    sx={{ marginLeft: 2, marginTop: 1 }}
                    disabled={textToEncrypt == '' || senderAddress == ''}
                    onClick={() => encryptText(textToEncrypt, senderAddress)}
                >
                    Send
                </Button>
            </Box>
        </>
    )


}