import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { encrypt } from '@metamask/eth-sig-util'
import Deb0x from "../../ethereum/deb0x"
import { create } from 'ipfs-http-client';
import {
    Box, Typography
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
import {getKeyMoralis} from "../../ethereum/EventLogsMoralis";
import { signMetaTxRequest } from '../../ethereum/signer';
import { createInstance } from '../../ethereum/forwarder'
import dataFromWhitelist from '../../constants.json';
import deb0xViews from '../../ethereum/deb0xViews';
import { convertStringToBytes32} from '../../../src/ethereum/Converter.js';

const { BigNumber } = require("ethers");
const deb0xAddress = "0xA06735da049041eb523Ccf0b8c3fB9D36216c646";
const deb0xViewsAddress = "0x51CcBf6DA6c14b6A31Bc0FcA07056151fA003aBC";
const ethUtil = require('ethereumjs-util')
const { whitelist } = dataFromWhitelist;

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


export function Minting(): any {
    const { account, library } = useWeb3React()
    const [encryptionKey, setKey] = useState('')
    const [textToEncrypt, setTextToEncrypt] = useState('')
    const [encryptionKeyInitialized, setEncryptionKeyInitialized] = useState('')
    const [senderAddress, setSenderAddress] = useState('')
    const [notificationState, setNotificationState] = useState({})
    const [messageSessionSentCounter, setMessageSessionSentCounter] = useState(0)
    const [loading, setLoading] = useState(false)
    const [addressList, setAddressList] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null);
    const [ input, setInput ] = useState(JSON.parse(localStorage.getItem('input') || 'null'));
    const [address, setAddress] = useState<string>();
    const [count, setCount] = useState(0);

    useEffect(() => {  
        if(address)
            addressList.push(address)
    }, []);

    useEffect(() => {
        if(input !== null && input.match(/^0x[a-fA-F0-9]{40}$/g)) {
            isValid(input).then((result: any) => {
                if(result)
                    addressList.push(input);
                else
                localStorage.removeItem('input');
            })
        }
    }, [input]);

    useEffect(() => setInput(JSON.parse(localStorage.getItem('input') || 'null')));

    useEffect(() => {
        if (!encryptionKeyInitialized) {
            getPublicEncryptionKey()
        }
    }, []);

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
        const deb0xViewsContract = deb0xViews(library, deb0xViewsAddress);
        return await getKeyMoralis(address);
    }

    function isInList(address: any) {
        return addressList.includes(address);
    }

    function isAddress(address: any) {
        return ethers.utils.isAddress(address);
    }

    async function fetchSendResult(request: any, url: any) {
        await fetch(url, {
            method: 'POST',
            body: JSON.stringify(request),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((response) => response.json())
            .then(async (data) => {
                try{
                    const {tx: txReceipt} = JSON.parse(data.result)
                    if(txReceipt.status == 1){
                        setNotificationState({
                            message: "Message was succesfully sent.",
                            open: true,
                            severity: "success"
                        })
    
                        let count = messageSessionSentCounter + 1;
                        setMessageSessionSentCounter(count);
                        setEditorState(EditorState.createEmpty());
                    } else {
                        setNotificationState({
                            message: "Message couldn't be sent!",
                            open: true,
                            severity: "error"
                        })
                    }
                } catch(error) {
                    if(data.status == "pending") {
                        setNotificationState({
                            message: "Your transaction is pending. Your message should arrive shortly",
                            open: true,
                            severity: "info"
                        })
                    } else if(data.status == "error") {
                        setNotificationState({
                            message: "Transaction relayer error. Please try again",
                            open: true,
                            severity: "error"
                        })
                    }
                }
                
            })
    }

    async function sendMessageTx(deb0xContract: any, recipients: any, cids: any) {
        try {
            const overrides = 
                { value: ethers.utils.parseUnits("0.01", "ether"),
                    gasLimit:BigNumber.from("1000000") }
            const tx = await deb0xContract["send(address[],bytes32[][],address,uint256,uint256)"](recipients,
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
    }

    async function encryptText(messageToEncrypt: any, destinationAddresses: any)
    {
        setLoading(true);
        const signer = await library.getSigner(0);
        let cids:any = []
        let recipients = destinationAddresses.flat()
        recipients.push(await signer.getAddress())
        const deb0xContract = Deb0x(signer, deb0xAddress);

        for (let address of recipients) {
            const destinationAddressEncryptionKey = await getKeyMoralis(address);
            const encryptedMessage = ethUtil.bufferToHex(
                Buffer.from(
                    JSON.stringify(
                        encrypt({
                            publicKey: destinationAddressEncryptionKey || '',
                            data: messageToEncrypt,
                            version: 'x25519-xsalsa20-poly1305'
                        }
                        )
                    ),
                    'utf8'
                )
            )
            const message = await client.add(encryptedMessage);
            cids.push(convertStringToBytes32(message.path))
        }
        const from = await signer.getAddress();
        if(whitelist.includes(from)) {
            const url = "https://api.defender.openzeppelin.com/autotasks/b939da27-4a61-4464-8d7e-4b0c5dceb270/runs/webhook/f662ac31-8f56-4b4c-9526-35aea314af63/SPs6smVfv41kLtz4zivxr8";
            const forwarder = createInstance(library)
            const data = deb0xContract.interface.encodeFunctionData("send(address[],bytes32[][],address,uint256,uint256)",
            [recipients, cids, ethers.constants.AddressZero, 0, 0])
            const to = deb0xContract.address

            try {
                const request = await signMetaTxRequest(library, forwarder, { to, from, data }, '100000000000000000');

                await fetchSendResult(request, url)

            } catch (error: any) {
                setNotificationState({
                    message: "You rejected the transaction. Message was not sent.",
                    open: true,
                    severity: "info"
                })
            }
        } else {
            await sendMessageTx(deb0xContract, recipients, cids);
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
        const key = await getKeyMoralis(account)
        setEncryptionKeyInitialized(key || '')
    }
    const [editorState, setEditorState] = useState(() => 
        EditorState.createEmpty()
    );

    const handleEditorChange = (state: any) => {
        if (senderAddress != '') {
            isValid(senderAddress);
        } else {
            setNotificationState({
                message: null,
                severity: "error"
            })
            setError(null);
        }
        setEditorState(state);
        sendContent();
    };

    const handleAddressBlur = (state: any) => {
        if (senderAddress != '') {
            isValid(senderAddress);
        } else {
            setNotificationState({
                message: null,
                severity: "error"
            })
            setError(null);
        }
    };

    const sendContent = () => {
        setTextToEncrypt(draftToHtml(convertToRaw(editorState.getCurrentContent())));
    };

    const handleInputChange = (e: any)=>{
        if(count > 100) {
            setCount(100)
        } else {
            setCount(e.target.value);
        }
    }

    const incNum = () => {
        if(count < 100)
            setCount(Number(count)+1);
    };

    const decNum = () => {
        if(count > 0)
            setCount(count - 1);
    }

    return (
        <>
            <SnackbarNotification state={notificationState} 
                setNotificationState={setNotificationState} />
            <div className="form-container content-box">
                <Box component="form"
                    noValidate
                    autoComplete="off">
                    <div className="row">
                        <button className="btn btn-outline-primary" type="button" onClick={decNum}>-</button>
                        <div>
                            <input type="number" value={count} max="100" onChange={handleInputChange}/>
                            <span><small>max value 100</small></span>
                        </div>
                        <button className="btn btn-outline-primary" type="button" onClick={incNum}>+</button>
                    </div>
                    
                    <Editor
                        editorState={editorState}
                        onEditorStateChange={handleEditorChange}
                        toolbarClassName="toolbar"
                        wrapperClassName="wrapper"
                        editorClassName="editor"
                    />
                        <Box className="form-bottom">
                            {textToEncrypt == '' || addressList.length === 0 ?
                                <Box className='rewards'>
                                    <Typography>
                                        {/* Estimated rewards: 9.62 DBX */}
                                    </Typography>
                                </Box> : 
                                null
                            }
                            <div>
                            <LoadingButton className="send-btn" 
                                loading={loading} 
                                endIcon={ loading ? 
                                    null : 
                                    <img src={airplaneBlack} className="send-papper-airplane" alt="send-button"></img>
                                }
                                loadingPosition="end"
                                disabled={textToEncrypt == '' && addressList.length === 0}
                                onClick={() => {
                                    encryptText(textToEncrypt, addressList)
                                }
                                } >
                                    Send
                            </LoadingButton>
                            </div>
                        </Box>
                </Box>
            </div>
        </>
    )
}