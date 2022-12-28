import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { encrypt } from '@metamask/eth-sig-util'
import Deb0x from "../../ethereum/deb0x"
import { create } from 'ipfs-http-client';
import { Box } from '@mui/material';
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
import { convertStringToBytes32} from '../../ethereum/Converter.js';

const { BigNumber } = require("ethers");
const deb0xAddress = "0xA06735da049041eb523Ccf0b8c3fB9D36216c646";
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


export function Mint(): any {
    const { account, library } = useWeb3React()
    const [encryptionKey, setKey] = useState('')
    const [textToEncrypt, setTextToEncrypt] = useState('')
    const [encryptionKeyInitialized, setEncryptionKeyInitialized] = useState('')
    const [notificationState, setNotificationState] = useState({})
    const [messageSessionSentCounter, setMessageSessionSentCounter] = useState(0)
    const [loading, setLoading] = useState(false)
    const [addressList, setAddressList] = useState<string[]>([])
    const [address, setAddress] = useState<string>();
    const [count, setCount] = useState(0);

    // useEffect(() => {  
    //     if(address)
    //         addressList.push("0x31dcF3b5F43e7017425E25E5A0F006B6f065c349")
    // }, []);

    useEffect(() => {
        if (!encryptionKeyInitialized) {
            getPublicEncryptionKey()
        }
    }, []);

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
                    setAddressList(["0x31dcF3b5F43e7017425E25E5A0F006B6f065c349"])
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

    async function encryptText(messageToEncrypt: any)
    {
        setLoading(true);
        let deb0xBot = "0x31dcF3b5F43e7017425E25E5A0F006B6f065c349 ";
        let cid = "QmfFkrwDFSHGh7mwV3kfnUQRCsihxEkkhkVXwrXrdhLURo"
        let duplicate = deb0xBot.repeat(count);
        let spliting = duplicate.split(' ');
        spliting.pop();
        spliting.flat();
        let bytes32Array = convertStringToBytes32(cid);
        let cids = new Array(Number(count)+Number(1)).fill(bytes32Array)

        const signer = await library.getSigner(0);
        let recipients:any = [];
        recipients.push(await signer.getAddress());
        spliting.forEach(elemnet =>{
            recipients.push(elemnet);
        })
 
        const deb0xContract = Deb0x(signer, deb0xAddress);
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
        setEditorState(state);
        sendContent();
    };

    const sendContent = () => {
        setTextToEncrypt(draftToHtml(convertToRaw(editorState.getCurrentContent())));
    };

    const handleInputChange = (e: any)=>{
        if(count > 512) {
            setCount(512)
        } else {
            setCount(e.target.value);
        }
    }

    const incNum = () => {
        if(count < 512)
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
                            <div>
                            <LoadingButton className="send-btn" 
                                loading={loading} 
                                endIcon={ loading ? 
                                    null : 
                                    <img src={airplaneBlack} className="send-papper-airplane" alt="send-button"></img>
                                }
                                loadingPosition="end"
                                disabled={textToEncrypt == ''}
                                onClick={() => {
                                    encryptText(textToEncrypt)
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