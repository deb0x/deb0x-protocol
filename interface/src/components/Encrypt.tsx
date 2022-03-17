import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { encrypt } from '@metamask/eth-sig-util'
import Deb0x from "../ethereum/deb0x"
import { create } from 'ipfs-http-client'
import SendIcon from '@mui/icons-material/Send';
import {
    Box, TextField, Button, Typography
} from '@mui/material';
import { ethers } from "ethers";
import SnackbarNotification from './Snackbar';
import LoadingButton from '@mui/lab/LoadingButton';
import '../componentsStyling/Encrypt.css';


const deb0xAddress = "0xf98E2331E4A7a542Da749978E2eDC4a572E81b99";
const ethUtil = require('ethereumjs-util')


const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
})

export function Encrypt(): any {
    const { account, library } = useWeb3React()
    const [encryptionKey, setKey] = useState('')
    const [textToEncrypt, setTextToEncrypt] = useState('')
    const [encryptionKeyInitialized, setEncryptionKeyInitialized] = useState('')
    const [senderAddress, setSenderAddress] = useState('')
    const [notificationState, setNotificationState] = useState({})
    const [messageSessionSentCounter, setMessageSessionSentCounter] = useState(0);
    const [loading, setLoading] = useState(false);
    const [estimatedReward, setEstimatedReward] = useState("9.32");

    useEffect(() => {
        if (!encryptionKeyInitialized) {
            getPublicEncryptionKey()
        }
    }, []);

    async function encryptText(messageToEncrypt: any, destinationAddress: any) {
        setLoading(true);
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

        try {
            const overrides = { value: ethers.utils.parseUnits("0.001", "ether"), }

            const tx = await deb0xContract.send(destinationAddress, message.path, overrides)

            await tx.wait()
                .then((result: any) => {
                    setNotificationState({
                        message: "Message was succesfully sent.", open: true,
                        severity: "success"
                    })

                    let count = messageSessionSentCounter + 1;
                    setMessageSessionSentCounter(count);
                })
                .catch((error: any) => {
                    setNotificationState({
                        message: "Message couldn't be sent!", open: true,
                        severity: "error"
                    })
                    console.log(error)
                })
        } catch (error: any) {
            setNotificationState({
                message: "You rejected the transaction. Message was not sent.", open: true,
                severity: "info"
            })
        }

        setTextToEncrypt("");
        setSenderAddress("");
        setLoading(false);

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
            <SnackbarNotification state={notificationState} setNotificationState={setNotificationState} />
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
            <div className="form-container">
                <Box
                    component="form"
                    sx={{
                        '& .MuiTextField-root': { m: 1, width: '150ch' },
                    }}
                    noValidate
                    autoComplete="off"
                >
                    <TextField id="standard-basic" placeholder="Destination Address" variant="standard"
                        sx={{
                            '& > :not(style)': { m: 1, width: '44ch' },
                        }}
                        value={senderAddress}
                        onChange={e => setSenderAddress(e.target.value)}
                    />

                    <TextField
                        id="outlined-multiline-static"
                        placeholder="Message"
                        multiline
                        rows={10}
                        value={textToEncrypt}
                        onChange={e => setTextToEncrypt(e.target.value)}
                    />
                    {

                        messageSessionSentCounter === 0 ?
                            <Box sx={{ display: "flex", alignItems: "end", justifyContent: "flex-end", flexDirection: "column", mr:1 }}>
                                {textToEncrypt != '' && senderAddress != '' ?
                                    <Box>
                                        <Typography sx={{color: "#fff"}}><small>est. rewards: {estimatedReward} DBX</small></Typography>
                                    </Box> : null
                                }

                                <LoadingButton className="send-btn" loading={loading} variant="contained" endIcon={<SendIcon />}
                                    sx={{ marginLeft: 2, marginTop: 1 }}
                                    disabled={textToEncrypt == '' || senderAddress == ''}
                                    onClick={() => encryptText(textToEncrypt, senderAddress)}
                                >
                                    Send
                                </LoadingButton>
                            </Box>
                            :
                            <Box  sx={{ display: "flex", alignItems: "end", justifyContent: "flex-end", flexDirection: "column", mr:1 }}> 
                                {textToEncrypt != '' && senderAddress != '' ?
                                    <Box>
                                        <Typography sx={{color: "#fff"}}><small>est. rewards: {estimatedReward} DBX</small></Typography>
                                    </Box> : null
                                }

                                <LoadingButton className="send-btn" loading={loading} variant="contained" endIcon={<SendIcon />}
                                    sx={{ marginLeft: 2, marginTop: 1 }}
                                    disabled={textToEncrypt == '' || senderAddress == ''}
                                    onClick={() => encryptText(textToEncrypt, senderAddress)}
                                >
                                    Send another message
                                </LoadingButton>
                            </Box>
                    }
                </Box>
            </div>
        </>
    )


}