import { useState, useEffect, useContext } from 'react';
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
import '../../componentsStyling/encrypt.scss';
import { EditorState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Editor } from 'react-draft-wysiwyg';
import airplaneBlack from '../../photos/icons/airplane-black.svg';

const { BigNumber } = require("ethers");
const deb0xAddress = "0xb6057a156D1D5BAB08DAb590dC052B66051394e2";
const ethUtil = require('ethereumjs-util')

const projectId = process.env.REACT_APP_PROJECT_ID
const projectSecret = process.env.REACT_APP_PROJECT_SECRET
const projectIdAndSecret = `${projectId}:${projectSecret}`

const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(projectIdAndSecret).toString(
      'base64'
    )}`,
  },
})

export function Encrypt(replyAddress: any): any {
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
    const [error, setError] = useState<string | null>(null);
    const [ input, setInput ] = useState(JSON.parse(localStorage.getItem('input') || 'null'));
    const [address, setAddress] = useState<string>(replyAddress.props);

    useEffect(() => {
        if(input !== null && input.match(/^0x[a-fA-F0-9]{40}$/g))
            addressList.push(input)
        
        if(address)
            addressList.push(address)
    }, []);

    useEffect(() => {
        if (!encryptionKeyInitialized) {
            getPublicEncryptionKey()
        }
    }, []);

    async function handleKeyDown(evt: any) {
        if (["Enter", "Tab", ","].includes(evt.key)) {
            evt.preventDefault();

            var value = senderAddress.trim();

            if (value && await isValid(value)) {
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

    async function handlePaste(evt: any) {
        evt.preventDefault()
        var paste = evt.clipboardData.getData("text")
        if(await isValid(paste)) {
            setAddressList([...addressList, paste])
            console.log([...addressList, paste])
            console.log(addressList)
        }
    }

    async function isValid(address: any) {
        let error = null;

        if (isInList(address)) {
            error = `${address} has already been added.`;
        }

        if (!isAddress(address)) {
            error = `${address} is not a valid ethereum address.`;
        } else if (await isInitialized(address) == "") {
            error = `${address} has not initialized deb0x.`;
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

    async function isInitialized(address: any) {
        const deb0xContract = Deb0x(library, deb0xAddress)
        return await deb0xContract.encryptionKeys(address);
    }

    function isInList(address: any) {
        return addressList.includes(address);
    }

    function isAddress(address: any) {
        return ethers.utils.isAddress(address);
    }

    async function encryptText(messageToEncrypt: any, destinationAddresses: any)
    {
        setLoading(true);
        const signer = await library.getSigner(0);
        let cids:any = []
        console.log(destinationAddresses)
        let recipients = replyAddress.props ? [replyAddress.props].flat() : destinationAddresses.flat()
        recipients.push(await signer.getAddress())
        const deb0xContract = Deb0x(signer, deb0xAddress);
        for (let address of recipients) {
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
            const overrides = 
                { value: ethers.utils.parseUnits("0.1", "ether"),
                    gasLimit:BigNumber.from("1000000") }
            const tx = await deb0xContract["send(address[],string[],address,uint256,uint256)"](recipients,
                cids,
                ethers.constants.AddressZero,
                0,
                0,
                overrides)

            await tx.wait()
                .then((result: any) => {
                    setNotificationState({
                        message: "Message was succesfully sent.",
                        open: true,
                        severity: "success"
                    })

                    let count = messageSessionSentCounter + 1;
                    setMessageSessionSentCounter(count);
                    setEditorState(EditorState.createEmpty());
                })
                .catch((error: any) => {
                    setNotificationState({
                        message: "Message couldn't be sent!",
                        open: true,
                        severity: "error"
                    })
                })
        } catch (error: any) {
            setNotificationState({
                message: "You rejected the transaction. Message was not sent.",
                open: true,
                severity: "info"
            })
        }

        setTextToEncrypt('');
        setSenderAddress("");
        setAddressList([]);
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
        setEncryptionKeyInitialized(key)
    }
    const [editorState, setEditorState] = useState(() =>
        EditorState.createEmpty()
    );

    const handleEditorChange = (state: any) => {
        setEditorState(state);
        sendContent();
    };

    const sendContent = () => {
        setTextToEncrypt(draftToHtml(convertToRaw(editorState.getCurrentContent())));
    };

    return (
        <>
            <SnackbarNotification state={notificationState} 
                setNotificationState={setNotificationState} />
            <div className="form-container content-box">
                <Box component="form"
                    noValidate
                    autoComplete="off">
                    {!address && 
                        <>
                            <TextField id="standard-basic"
                                placeholder="Ethereum address (e.g.0x31dc...) or ENS domain name (e.g test.deb0x.eth)"
                                value={senderAddress}
                                onPaste={handlePaste}
                                onKeyDown={handleKeyDown}
                                onChange={handleChange} />
                            <Stack direction="row" spacing={1}>
                                <Box sx={{ width: '100%', margin: '0 auto' }}
                                    className="address-list">
                                    {
                                        addressList.map((address: any) => {
                                            return (
                                                <Chip
                                                    key={address}
                                                    label={address}
                                                    onDelete={() => handleDelete(address)}
                                                    deleteIcon={<DeleteIcon />}
                                                />
                                            )
                                        })
                                    }
                                </Box>
                            </Stack>
                        </>
                    }
                    
                    <Editor
                        editorState={editorState}
                        onEditorStateChange={handleEditorChange}
                        toolbarClassName="toolbar"
                        wrapperClassName="wrapper"
                        editorClassName="editor"
                    />
                    { messageSessionSentCounter === 0 ?
                        <Box sx={{ display: "flex", 
                            alignItems: "end", 
                            justifyContent: "flex-end", 
                            flexDirection: "column", 
                            mr: 1 }}>
                            {textToEncrypt != '' && senderAddress != '' ?
                                <Box>
                                    <Typography>
                                        <small>
                                            est. rewards: {estimatedReward} DBX
                                        </small>
                                    </Typography>
                                </Box> : 
                                null
                            }

                            <LoadingButton className="send-btn" 
                                loading={loading} 
                                endIcon={ loading ? 
                                    null : 
                                    <img src={airplaneBlack} className="send-papper-airplane" alt="send-button"></img>
                                }
                                loadingPosition="end"
                                sx={{ marginLeft: 2, marginTop: 1 }}
                                disabled={textToEncrypt == '' || addressList == []}
                                onClick={() => {
                                    encryptText(textToEncrypt, addressList)
                                }
                                    
                                } >
                            </LoadingButton>
                        </Box>
                        :
                        <Box sx={{ display: "flex", 
                            alignItems: "end", 
                            justifyContent: "flex-end",
                            flexDirection: "column",
                            mr: 1 }}>
                            {textToEncrypt != '' && senderAddress != '' ?
                                <Box>
                                    <Typography>
                                        <small>
                                            est. rewards: {estimatedReward} DBX
                                        </small>
                                    </Typography>
                                </Box> : 
                                null
                            }

                            <LoadingButton className="send-btn" 
                                loading={loading} variant="contained" 
                                endIcon={ <img src={airplaneBlack} className="send-papper-airplane" alt="send-button"></img> }
                                sx={{ marginLeft: 2, marginTop: 1 }}
                                onClick={() => encryptText(textToEncrypt, senderAddress)}>
                            </LoadingButton>
                        </Box>
                    }
                </Box>
            </div>
        </>
    )
}