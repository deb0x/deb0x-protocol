import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { encrypt } from '@metamask/eth-sig-util'
import Deb0x from "../../ethereum/deb0x"
import { create } from 'ipfs-http-client'
import SendIcon from '@mui/icons-material/Send';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box, TextField, Typography
} from '@mui/material';
import { ethers } from "ethers";
import SnackbarNotification from './Snackbar';
import LoadingButton from '@mui/lab/LoadingButton';
import '../componentsStyling/Encrypt.css';
import { AnyMxRecord } from 'dns';


const deb0xAddress = "0x13dA6EDcdD7F488AF56D0804dFF54Eb17f41Cc61";
const ethUtil = require('ethereumjs-util')


const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
})

export function Encrypt(): any {

    //     import React from "react";
    // import ReactDOM from "react-dom";

    // import "./styles.css";

    // class App extends React.Component {
    //   state = {
    //     items: [],
    //     value: "",
    //     error: null
    //   };

    //   handleKeyDown = evt => {
    //     if (["Enter", "Tab", ","].includes(evt.key)) {
    //       evt.preventDefault();

    //       var value = this.state.value.trim();

    //       if (value && this.isValid(value)) {
    //         this.setState({
    //           items: [...this.state.items, this.state.value],
    //           value: ""
    //         });
    //       }
    //     }
    //   };

    //   handleChange = evt => {
    //     this.setState({
    //       value: evt.target.value,
    //       error: null
    //     });
    //   };

    //   handleDelete = item => {
    //     this.setState({
    //       items: this.state.items.filter(i => i !== item)
    //     });
    //   };

    //   handlePaste = evt => {
    //     evt.preventDefault();

    //     var paste = evt.clipboardData.getData("text");
    //     var emails = paste.match(/[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/g);

    //     if (emails) {
    //       var toBeAdded = emails.filter(email => !this.isInList(email));

    //       this.setState({
    //         items: [...this.state.items, ...toBeAdded]
    //       });
    //     }
    //   };

    //   isValid(email) {
    //     let error = null;

    //     if (this.isInList(email)) {
    //       error = `${email} has already been added.`;
    //     }

    //     if (!this.isEmail(email)) {
    //       error = `${email} is not a valid email address.`;
    //     }

    //     if (error) {
    //       this.setState({ error });

    //       return false;
    //     }

    //     return true;
    //   }

    //   isInList(email) {
    //     return this.state.items.includes(email);
    //   }

    //   isEmail(email) {
    //     return /[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/.test(email);
    //   }

    //   render() {
    //     return (
    //       <>
    //         {this.state.items.map(item => (
    //           <div className="tag-item" key={item}>
    //             {item}
    //             <button
    //               type="button"
    //               className="button"
    //               onClick={() => this.handleDelete(item)}
    //             >
    //               &times;
    //             </button>
    //           </div>
    //         ))}

    //         <input
    //           className={"input " + (this.state.error && " has-error")}
    //           value={this.state.value}
    //           placeholder="Type or paste email addresses and press `Enter`..."
    //           onKeyDown={this.handleKeyDown}
    //           onChange={this.handleChange}
    //           onPaste={this.handlePaste}
    //         />

    //         {this.state.error && <p className="error">{this.state.error}</p>}
    //       </>
    //     );
    //   }
    // }

    // const rootElement = document.getElementById("root");
    // ReactDOM.render(<App />, rootElement);


    const { account, library } = useWeb3React()
    const [encryptionKey, setKey] = useState('')
    const [textToEncrypt, setTextToEncrypt] = useState('')
    const [encryptionKeyInitialized, setEncryptionKeyInitialized] = useState('')
    const [senderAddress, setSenderAddress] = useState('')
    const [notificationState, setNotificationState] = useState({})
    const [messageSessionSentCounter, setMessageSessionSentCounter] = useState(0)
    const [loading, setLoading] = useState(false)
    const [estimatedReward, setEstimatedReward] = useState("9.32");
    const [addressList, setAddressList] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!encryptionKeyInitialized) {
            getPublicEncryptionKey()
        }
    }, []);

    function handleKeyDown(evt: any) {
        if (["Enter", "Tab", ","].includes(evt.key)) {
            evt.preventDefault();

            var value = senderAddress.trim();

            if (value && isValid(value)) {
                setAddressList([...addressList, senderAddress])
                setSenderAddress("")
            }
        }
    }

    function handleChange(evt: any) {
        setSenderAddress(evt.target.value)
        setError(null)
    }

    function handleDelete(item: any) {
        setAddressList(addressList.filter(i => i !== item))
    }

    function handlePaste(evt: any) {
        evt.preventDefault()

        var paste = evt.clipboardData.getData("text")
        var addresses = paste.match(/^0x[a-fA-F0-9]{40}$/g)

        if (addresses) {
            var toBeAdded = addresses.filter((address: any) => !isInList(address))

            setAddressList([...addressList, ...toBeAdded])
        }
    }

    function isValid(address: any) {
        let error = null;

        if (isInList(address)) {
            error = `${address} has already been added.`;
        }

        if (!isAddress(address)) {
            error = `${address} is not a valid ethereum address.`;
        }

        if (error) {
            setNotificationState({
                message: error, open: true,
                severity: "error"
            })
            setError(error);

            return false;
        }

        return true;
    }

    function isInList(address: any) {
        return addressList.includes(address);
    }

    function isAddress(address: any) {
        return ethers.utils.isAddress(address);
    }

    async function encryptText(messageToEncrypt: any, destinationAddresses: any) {

        setLoading(true);
        const signer = await library.getSigner(0);
        let cids:any = []
        let recipients = destinationAddresses.flat()
        recipients.push(await signer.getAddress())
        const deb0xContract = Deb0x(signer, deb0xAddress);
        for (let address of recipients) {
            console.log(recipients, address)
            const destinationAddressEncryptionKey = await deb0xContract.getKey(address);
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
            cids.push(message.path)
        }

        try {
            const overrides = { value: ethers.utils.parseUnits("0.001", "ether"), }
            console.log(recipients, cids)
            const tx = await deb0xContract.send(recipients, cids, overrides)

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
            console.log(error)
            setNotificationState({
                message: "You rejected the transaction. Message was not sent.", open: true,
                severity: "info"
            })
        }

        setTextToEncrypt("");
        setSenderAddress("");
        setAddressList([])
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
            <div className="form-container">
                <Box
                    component="form"
                    sx={{
                        '& .MuiTextField-root': { m: 1, width: '150ch' },
                    }}
                    noValidate
                    autoComplete="off"
                >
                    <TextField id="standard-basic" variant="standard"
                        sx={{
                            '& > :not(style)': { m: 1, width: '44ch' },
                        }}
                        placeholder="Type or paste addresses and press `Enter`..."
                        value={senderAddress}
                        onPaste={handlePaste}
                        onKeyDown={handleKeyDown}
                        onChange={handleChange}
                    />
                    <Stack direction="row" spacing={1}>
                        <Box sx={{ width: '100%', maxWidth: 1080, margin: '0 auto' }}>
                            {
                                addressList.map((address: any) => {
                                    return (
                                        <Chip
                                            key={address}
                                            color="primary"
                                            label={address}
                                            onDelete={() => handleDelete(address)}
                                            deleteIcon={<DeleteIcon />}
                                            variant="outlined"
                                        />
                                    )
                                })
                            }
                        </Box>
                    </Stack>
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
                            <Box sx={{ display: "flex", alignItems: "end", justifyContent: "flex-end", flexDirection: "column", mr: 1 }}>
                                {textToEncrypt != '' && senderAddress != '' ?
                                    <Box>
                                        <Typography sx={{ color: "#fff" }}><small>est. rewards: {estimatedReward} DBX</small></Typography>
                                    </Box> : null
                                }

                                <LoadingButton className="send-btn" loading={loading} variant="contained" endIcon={<SendIcon />}
                                    sx={{ marginLeft: 2, marginTop: 1 }}
                                    disabled={textToEncrypt == '' || addressList == []}
                                    onClick={() => encryptText(textToEncrypt, addressList)}
                                >
                                    Send
                                </LoadingButton>
                            </Box>
                            :
                            <Box sx={{ display: "flex", alignItems: "end", justifyContent: "flex-end", flexDirection: "column", mr: 1 }}>
                                {textToEncrypt != '' && senderAddress != '' ?
                                    <Box>
                                        <Typography sx={{ color: "#fff" }}><small>est. rewards: {estimatedReward} DBX</small></Typography>
                                    </Box> : null
                                }

                                <LoadingButton className="send-btn" loading={loading} variant="contained" endIcon={<SendIcon />}
                                    sx={{ marginLeft: 2, marginTop: 1 }}
                                    disabled={textToEncrypt === '' || senderAddress === ''}
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