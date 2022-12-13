import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import Deb0x from "../../ethereum/deb0x"
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
import { signMetaTxRequest } from '../../ethereum/signer';
import { createInstance } from '../../ethereum/forwarder'
import dataFromWhitelist from '../../constants.json';
import useAnalyticsEventTracker from '../Common/GaEventTracker';
import { FrontendLibrary } from '../../front-library';

const deb0xAddress = "0x3A274DD833726D9CfDb6cBc23534B2cF5e892347";
const deb0xViewsAddress = "0x3a6B3Aff418C7E50eE9F852D0bc7119296cc3644";
const ethUtil = require('ethereumjs-util')
const { whitelist } = dataFromWhitelist;

export function Encrypt(replyAddress?: any): any {
    const { library } = useWeb3React()
    const [textToEncrypt, setTextToEncrypt] = useState('')
    const [senderAddress, setSenderAddress] = useState('')
    const [notificationState, setNotificationState] = useState({})
    const [messageSessionSentCounter, setMessageSessionSentCounter] = useState(0)
    const [loading, setLoading] = useState(false)
    const [addressList, setAddressList] = useState<string[]>([])
    const [, setError] = useState<string | null>(null);
    const [ input, setInput ] = useState(JSON.parse(localStorage.getItem('input') || 'null'));
    const [address] = useState<string>(replyAddress.props);

    const feLib = new FrontendLibrary(
        library,
        "0xdF7E7f4C0B8AfaF67F706d4b80cfFC4532f46Fa4",
        "0x8345742746c41BC9C004aD7BEE0b65E92F227347",
        "0xf032f7FB8258728A1938473B2115BB163d5Da593");

    useEffect(() => {  
        if(address)
            addressList.push(address)
    }, []);

    useEffect(() => {
        if(input !== null && input.match(/^0x[a-fA-F0-9]{40}$/g))
            addressList.push(input);
    }, [input]);

    useEffect(() => setInput(JSON.parse(localStorage.getItem('input') || 'null')));

    useEffect(() => {
        (document.querySelector(".editor") as HTMLElement).click()
        setTimeout(() => {
            setTextToEncrypt("")
        }, 100)
    }, [])

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
        }
    }

    async function isValid(address: any) {
        let error = null;
        if (isInList(address)) {
            error = `${address} has already been added.`;
        }
        if (!isAddress(address)) {
            error = `${address} is not a valid ethereum address.`;
        } else if (await feLib.isInitialized(address) === "") {
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
        let recipients = replyAddress.props ? [replyAddress.props].flat() : destinationAddresses.flat()

        let cids:any = await feLib.encryptText(messageToEncrypt, recipients, signer);
        
        const deb0xContract = Deb0x(signer, deb0xAddress);
        
        const from = await signer.getAddress();
        if(whitelist.includes(from)) {
            const url = "https://api.defender.openzeppelin.com/autotasks/b939da27-4a61-4464-8d7e-4b0c5dceb270/runs/webhook/f662ac31-8f56-4b4c-9526-35aea314af63/SPs6smVfv41kLtz4zivxr8";
            const forwarder = createInstance(library)
            const data = 
                deb0xContract.interface.encodeFunctionData("send(address[],bytes32[][],address,uint256,uint256)",
                [recipients, cids, ethers.constants.AddressZero, 0, 0])
            const to = deb0xContract.address

            try {
                const request = await signMetaTxRequest(library, forwarder, { to, from, data }, '100000000000000000');
                gaEventTracker('Success: send message');

                await feLib.fetchSendResult(request, url).then((response: any) => setNotificationState(response))

            } catch (error: any) {
                setNotificationState({
                    message: "You rejected the transaction. Message was not sent.",
                    open: true,
                    severity: "info"
                })
                gaEventTracker('Reject: send message');
            }
        } else {
            await feLib.sendMessageTx(deb0xContract, recipients, cids).then((response: any) => console.log(response))
        }
        

        setTextToEncrypt('');
        setSenderAddress("");
        setAddressList([]);
        setLoading(false);
    }

    const [editorState, setEditorState] = useState(() => 
        EditorState.createEmpty()
    );

    const handleEditorChange = (state: any) => {
        if (senderAddress !== '') {
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

    const sendContent = () => {
        setTextToEncrypt(draftToHtml(convertToRaw(editorState.getCurrentContent())));
    };

    const gaEventTracker = useAnalyticsEventTracker('Encrypt');

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
                                <Box
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
                        onFocus={() => gaEventTracker("Compose message")}
                    />
                        <Box className="form-bottom">
                            {textToEncrypt === '' || addressList.length === 0 ?
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
                                disabled={textToEncrypt === '' && addressList.length === 0}
                                onClick={() => {
                                    encryptText(textToEncrypt, addressList);
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