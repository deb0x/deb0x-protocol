import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { encrypt } from '@metamask/eth-sig-util'
import Deb0x from "../ethereum/deb0x"
import { create } from 'ipfs-http-client'
const deb0xAddress = "0x6f5dDD41EAb5E6E3be7B7718b9dF6f2E7576fEd5";
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
            <h4 className="card-title">
                Encrypt / Decrypt
            </h4>

            <button
                className="btn btn-primary btn-lg btn-block mb-3"
                id="getEncryptionKeyButton"
                onClick={getEncryptionKey}
                disabled={encryptionKeyInitialized == ' '}
            >
                {encryptionKeyInitialized == '' ? "Get Encryption Key" : "Encryption key provided"}
            </button>

            <p className="info-text text-truncate alert alert-secondary">
                Encryption key: {encryptionKey}
            </p>

            <button
                className="btn btn-primary btn-lg btn-block mb-3"
                id="initializeDeb0x"
                disabled={encryptionKey == ''}
                onClick={initializeDeb0x}
            >
                {encryptionKeyInitialized == '' ? "Initialize Deb0x" : "Deb0x initialized"}
            </button>

            <hr />

            <div id="encrypt-message-form">
                <input
                    className="form-control"
                    type="text"
                    placeholder="Message to encrypt"
                    id="encryptMessageInput"
                    value={textToEncrypt}
                    onChange={e => setTextToEncrypt(e.target.value)}
                />

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
            </button>

            <p className="info-text text-truncate alert alert-secondary">
                Ciphertext: {cipheredText}
            </p>

            
        </>
    )
}