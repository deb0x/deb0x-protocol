import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import Deb0x from "../../ethereum/deb0x"
import {
    Tooltip, List, ListItem, ListItemText, ListItemButton, Typography, Box, 
    CircularProgress
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
        useEffect(()=>{
            checkENS();
        },[])
        const [isDecrypted, setIsDecrypted] = useState(false);

        async function checkENS() {
            let name = await library.lookupAddress(props.message.sender);
            if(name !== null) {   
                setEnsName(name);
            }
        }

        async function decryptMessage() {

            // if(props.parentIndex !==props.index)
            // {
            //     props.setCurrentIndex(props.index);
            //     props.hideMessage();
            // }

            const decryptedMessage = await decrypt(message)
            if(decryptedMessage) {
                setIsDecrypted(false);
                setMessage(decryptedMessage);
                setIsDecrypted(true);
            }
        }

        async function hideMessage() {
            setMessage(encryptMessage);
            setIsDecrypted(false);
            console.log("hide", props.message.fetchedMessage.index)
        }
        
        return (
            <ListItem sx ={{border:1, marginBottom:1}} 
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
                className="messages-list-item">
                <Tooltip 
                    title={(message === props.message.fetchedMessage.data) ? 
                    "Click to decrypt" : `Sender:${props.message.sender}`} 
                    placement="right">
                    <ListItemButton className="list-item-button"
                        onClick={() => {
                            if(message === props.message.fetchedMessage.data) {
                                decryptMessage()
                            }
                        }}>
                        <ListItemText primary={ (ensName === "")  ?
                        <>
                            <div className="message-left">
                                <div className="message-heading">
                                    <p><strong>
                                        {formatAccountName(props.message.sender)}
                                    </strong></p>
                                    <p className="time-stamp"><small>
                                        {messageTime}
                                    </small></p>
                                </div>
                                <p className="message message-overflow"
                                    dangerouslySetInnerHTML={{ __html: message }} />
                            </div>
                            {isDecrypted ? <div className="message-right">
                                <div className="message-heading">
                                    <p><strong>
                                        {formatAccountName(props.message.sender)}
                                    </strong></p>
                                    <p className="time-stamp"><small>
                                        {messageTime}
                                    </small></p>
                                </div>
                                <p className="message" 
                                    dangerouslySetInnerHTML={{ __html: message }} />
                            </div> : <></> }
                        </> :
                        <>
                            <div className="message-left">
                                <div className="message-heading">
                                    <p><strong>{ensName}</strong></p>
                                    <p className="time-stamp"><small>
                                        {messageTime}
                                    </small></p>
                                </div>
                                <p className="message message-overflow"
                                    dangerouslySetInnerHTML={{ __html: message }} />
                            </div>
                            {isDecrypted ? <div className="message-right">
                                <div className="message-heading">
                                    <p><strong>{ensName}</strong></p>
                                    <p className="time-stamp"><small>
                                        {messageTime}
                                    </small></p>
                                </div>
                                <p className="message" 
                                    dangerouslySetInnerHTML={{ __html: message }} />
                            </div> : <></> }
                        </>
                        }/>
                    </ListItemButton>
                </Tooltip>
            </ListItem>
        )
    }

    function GetMessages() {
        const [fetchedMessages, setFetchedMessages] = useState<any>([])
        const [currentIndex,setCurrentIndex] = useState<number>();




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
                    <Box sx={{ width: '100%', maxWidth: 1080, margin: '0 auto'}}>
                    <div className="row messages-list">
                        <List className="col-3">
                            {fetchedMessages.map((message: any, i: any) => {
                                return (
                                    <>
                                        <Message message={message} index={i} key={i} parentIndex={currentIndex} setIndex={setCurrentIndex} />
                                    </>
                                )
                            })}
                        </List>
                    </div>
                        
                    </Box>
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
            <div>
                <Box>
                    <Box className="pagination" sx={{display:"flex"}}>
                        <Pagination count={1} showFirstButton showLastButton />
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