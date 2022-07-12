import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import Deb0x from "../../ethereum/deb0x"
import {
    Tooltip, List, ListItem, ListItemText, ListItemButton, Typography, Box, 
    CircularProgress,
    Button,
    Modal
} from '@mui/material';
import Stepper from './Stepper'
import IconButton from "@mui/material/IconButton";
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Pagination from "@mui/material/Pagination";
import RefreshIcon from '@mui/icons-material/Refresh';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import axios from 'axios';
import formatAccountName from "../Common/AccountName";
import "../../componentsStyling/decrypt.scss"
import { Add } from '@mui/icons-material';
import ContactsSetter from '../ContactsSetter';
import lock from '../../photos/lock.svg';
import airplane from '../../photos/airplane.svg';
import users from '../../photos/users.svg';
import hand from '../../photos/hand.svg';

const deb0xAddress = "0x13dA6EDcdD7F488AF56D0804dFF54Eb17f41Cc61"

export function Decrypt(props: any): any {
    const { account, library } = useWeb3React()
    const [loading, setLoading] = useState(true)
    const [encryptionKeyInitialized, setEncryptionKeyInitialized] = 
        useState<boolean|undefined>(undefined);
    const [decrypted, setDecrypted] = useState<any>();


    useEffect(() => {
        setLoading(true)
        getPublicEncryptionKey()
    }, [account]);

    const getPublicEncryptionKey = async () => {
        const deb0xContract = Deb0x(library, deb0xAddress)
        const key = await deb0xContract.getKey(account)
        const initialized = (key != '') ? true : false
        setEncryptionKeyInitialized(initialized)
    }

    async function decrypt(encryptedMessage: any) {
        try {
            const decryptedMessage = await library.provider.request({
                method: 'eth_decrypt',
                params: [encryptedMessage, account],
            });
            return decryptedMessage
        } catch (error) {
            return undefined
        }
    }

    async function fetchMessage(message: any) {
        return await axios.get(`https://ipfs.io/ipfs/${message}`)
    }

    function Message(props: any) {
        const encryptMessage = props.message.fetchedMessage.data
        const [message, setMessage] =
            useState(props.message.fetchedMessage.data)
        const [ensName,setEnsName] = useState("");
        //const [sender, setSender] = useState(props.messsage.sender)
        const [messageTime, setMessageTime] = useState("Mar 17, 18:36")
        const [isDecrypted, setIsDecrypted] = useState(false);

        useEffect(()=>{
            checkENS();
        },[])

        useEffect(()=>{
            if(props.index !== props.previousIndex && isDecrypted===true){
                hideMessage();
            }

        },[props.previousIndex])


        async function checkENS() {
            let name = await library.lookupAddress(props.message.sender);
            if(name !== null) {   
                setEnsName(name);
            }
        }

        async function decryptMessage() {
            const decryptedMessage = await decrypt(message)
            if(decryptedMessage) {
                setIsDecrypted(false);
                setMessage(decryptedMessage);
                setIsDecrypted(true);
                props.setPreviousIndex(props.index);
            }
        }

        async function hideMessage() {
            setMessage(encryptMessage);
            setIsDecrypted(false);
        }

        return (
            <ListItem
                disablePadding 
                key={props.index}    
                secondaryAction={ 
                    <IconButton className={`${
                            (message !== props.message.fetchedMessage.data) ? 
                            "list-item-btn" : ""}`
                        }  
                        onClick={()=>{hideMessage()}}  
                        edge="end" 
                        aria-label="comments">
                        { (message !== props.message.fetchedMessage.data) ? 
                            <VisibilityOffIcon className='visibility-icon' /> : null
                        }
                    </IconButton>  
                }
                className="messages-list-item card">
                <ListItemButton 
                    className={`list-item-button ${isDecrypted ? "active" : ""}` }
                    onClick={() => {
                        if(message === props.message.fetchedMessage.data) {
                            decryptMessage()
                        }
                    }}>
                    <ListItemText primary={
                        <>
                            <div className="message-left">
                                <div className="message-heading">
                                    <p><strong>
                                        {ensName !== "" ? ensName : formatAccountName(props.message.sender)}
                                    </strong></p>
                                    <p className="time-stamp"><small>
                                        {messageTime}
                                    </small></p>
                                </div>
                                <p className="message message-overflow"
                                    dangerouslySetInnerHTML={{ __html: message }} />
                            </div>
                            {isDecrypted ? 
                                <div className="message-right">
                                    <div className="message-heading">
                                        <div className="address">
                                            <p>From: 
                                                <strong>
                                                    {ensName !== "" ? 
                                                        ensName : 
                                                        formatAccountName(
                                                            props.message.sender
                                                        )
                                                    }
                                                </strong>
                                            </p>
                                            <ContactsSetter props={props.message.sender}/>
                                        </div>
                                        
                                        <p className="time-stamp"><small>
                                            {messageTime}
                                        </small></p>
                                    </div>
                                    <p className="message" 
                                        dangerouslySetInnerHTML={{ __html: message }} />
                                </div> : 
                                <></> 
                            }
                        </> 
                    }/>
                </ListItemButton>
            </ListItem>
        )
    }

    function GetMessages() {
        const [fetchedMessages, setFetchedMessages] = useState<any>([])
        const [previousIndex, setPreviousIndex] = useState<number>();

        useEffect(() => {
            processMessages()
        }, []);



        async function processMessages() {
            const deb0xContract = Deb0x(library, deb0xAddress)
            const senderAddresses = 
                await deb0xContract.fetchMessageSenders(account)
            const cidsPromises = 
                senderAddresses.map(async function(sender:any) {
                    return { 
                        cids: await deb0xContract.fetchMessages(account, sender),
                        sender: sender
                    }
                })

            const cids = await Promise.all(cidsPromises)

            const encryptedMessagesPromisesArray = 
                cids.map(async function(cidArray: any) {
                    const encryptedMessagesPromises = 
                        cidArray.cids.map(async function (cid: any) {
                            return { 
                                fetchedMessage: await fetchMessage(cid),
                                sender: cidArray.sender
                            }
                        })
                    const promise = await Promise.all(encryptedMessagesPromises)

                    return promise
                })

            const encryptedMessages = 
                await Promise.all(encryptedMessagesPromisesArray)
            
            setFetchedMessages(encryptedMessages.flat())
            setLoading(false)

        }

        if(!loading) {
            if (fetchedMessages.length === 0) {
                return (
                    <div className="message-placeholder">
                        <MailOutlineIcon />
                        <Typography variant="h5"
                            gutterBottom
                            component="div"
                            sx={{marginLeft: .8, marginTop: 3}}>
                            No messages yet.
                        </Typography>
                    </div>
                )
            } else {
                return (
                    <div className="row messages-list">
                        <List className="col-md-4 col-sm-12">
                            {fetchedMessages.map((message: any, i: any) => {
                                return (
                                    <Message message={message} index={i} 
                                        key={i} previousIndex={previousIndex} 
                                        setPreviousIndex={setPreviousIndex} />
                                )
                            })}
                        </List>
                        <Box className="intro-box col-md-8">
                            <div>
                                
                            </div>
                        </Box>
                    </div>
                )
            }
        } else {
            return (
                <div className="spinner">
                    <CircularProgress/>
                </div>
            )
        }
    }
    
    if (encryptionKeyInitialized === true) {
        return (
            <div className="content-box">
                <Box>
                    <Box className="pagination" sx={{display:"flex"}}>
                        <Pagination count={1} />
                        <IconButton size="large" onClick={()=> setLoading(true) }>
                            <RefreshIcon fontSize="large"/>
                        </IconButton>
                    </Box>
                    <Box>
                        <GetMessages />
                    </Box>
                </Box>
            </div>
        )
    } else if (encryptionKeyInitialized === false) {
        return (
            <Stepper onDeboxInitialization={getPublicEncryptionKey}/>
        )
    } else {
        return(
            <div className="spinner">
                <CircularProgress/>
            </div>
        )
    }
}