import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import Deb0x from "../ethereum/deb0x"
import {
    Tooltip, List, ListItem,
    ListItemText, ListItemButton, Typography, Box, CircularProgress
} from '@mui/material';
import Stepper from './Stepper'
import { border } from '@mui/system';
import IconButton from "@mui/material/IconButton";
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Pagination from "@mui/material/Pagination";
import RefreshIcon from '@mui/icons-material/Refresh';
import Refresh from '@mui/icons-material/Refresh';
import Button from "@mui/material/Button";
import '../componentsStyling/Decrypt.css';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

const axios = require('axios')
const deb0xAddress = "0xf98E2331E4A7a542Da749978E2eDC4a572E81b99"

export function Decrypt(props: any): any {
    const { account, library } = useWeb3React()
    const [loading, setLoading] = useState(true)
    const [encryptionKeyInitialized, setEncryptionKeyInitialized] = useState<boolean|undefined>(undefined)


    useEffect(() => {
        console.log("useEffect")
        setLoading(true)
        getPublicEncryptionKey()
    }, [account]);

    const getPublicEncryptionKey = async () => {
        const deb0xContract = Deb0x(library, deb0xAddress)
        console.log(account)
        const key = await deb0xContract.getKey(account)
        console.log(key)
        const initialized = (key != '') ? true : false
        console.log(initialized)
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
        const [message, setMessage] = useState(props.message.fetchedMessage.data)
        const [ensName,setEnsName] = useState("");
        //const [sender, setSender] = useState(props.messsage.sender)
        const [messageTime,setMessageTime] = useState("Mar 6, 15:56")
        useEffect(()=>{
            checkENS();
        },[])

        async function checkENS(){
            let name = await library.lookupAddress(props.message.sender);
            if(name !== null)
            {   
                // console.log(name)
                setEnsName(name);
            }
        }

        async function decryptMessage() {
            const decryptedMessage = await decrypt(message)
            if(decryptedMessage) {
                setMessage(decryptedMessage)
            }
        }

        async function hideMessage(){
            console.log("sss")
            setMessage(encryptMessage)
        }


    
        return (
            <ListItem sx ={{border:1, marginBottom:1}} disablePadding key={props.index}    secondaryAction={ 
                <IconButton className={`${(message != props.message.fetchedMessage.data) ? "list-item-btn" : ""}`}  
                        onClick={()=>{hideMessage()}}  edge="end" aria-label="comments">
                    { (message != props.message.fetchedMessage.data) ? <VisibilityOffIcon  />: null}
                </IconButton>  
            }
                className="list-item"
            >
                <Tooltip title={(message == props.message.fetchedMessage.data) ? "Click to decrypt" : `Sender:${props.message.sender}`} placement="right">
                    <ListItemButton onClick={() => {
                        if(message == props.message.fetchedMessage.data) {
                            decryptMessage()
                        }
                    }}>
                        <div>

                        </div>
                        <ListItemText
                        primary={ 
                         (ensName === "")  ?
                    
                        <>
                            <div className="message-heading">
                                <p><small>From: </small><strong>{props.message.sender.substring(0, 5)} ... {props.message.sender.substring(props.message.sender.length - 4)}</strong></p>
                                <p><small>{messageTime}</small></p>
                            </div>
                            <p>{(message == props.message.fetchedMessage.data) ? `${message.substring(0,95)}...` : message }</p>
                        </>
                         
                        :
                        <>
                            <div className="message-heading">
                                <p><small>From: </small><strong>{ensName}</strong></p>
                                <p><small>{messageTime}</small></p>
                            </div>
                            <p>{(message == props.message.fetchedMessage.data) ? `${message.substring(0,95)}...` : message }</p>
                        </>
                        }/>
                         
                    </ListItemButton>
                </Tooltip>
            </ListItem>
            )
    }

    function GetMessages() {

        const [fetchedMessages, setFetchedMessages] = useState<any>([])

        useEffect(() => {
            processMessages()
        }, []);

        async function processMessages() {
            const deb0xContract = Deb0x(library, deb0xAddress)
            
            const senderAddresses = await deb0xContract.fetchMessageSenders(account)

            const cidsPromises = senderAddresses.map(async function(sender:any){
                return { cids: await deb0xContract.fetchMessages(account, sender), sender: sender}
            })

            const cids = await Promise.all(cidsPromises)

            console.log(cids)

            const encryptedMessagesPromisesArray = cids.map(async function(cidArray: any) {
                console.log(cidArray)
                const encryptedMessagesPromises = cidArray.cids.map(async function (cid: any) {
                    return { fetchedMessage:await fetchMessage(cid), sender: cidArray.sender}
                })
                const promise = await Promise.all(encryptedMessagesPromises)

                return promise
            })

            const encryptedMessages = await Promise.all(encryptedMessagesPromisesArray)
            
            console.log(encryptedMessages)
            
            setFetchedMessages(encryptedMessages.flat())
            setLoading(false)
        }

        if(!loading) {
            if (fetchedMessages.length == 0) {
                return (
                    <>
                        <div className="message-placeholder">
                            <MailOutlineIcon />
                            <Typography variant="h5"
                                gutterBottom
                                component="div"
                                sx={{marginLeft: .8, marginTop: 3}}
                            >
                                No messages yet.
                            </Typography>
                        </div>
                    </>
                )
            } else {
                return (
                    <Box sx={{ width: '100%', maxWidth: 1080, margin: '0 auto'}}>
                        <List>
                            {fetchedMessages.map((message: any, i: any) => {
                                return (
                                    
                                        <Message message={message} index={i} key={i} />
                                )
                            })}
                        </List>
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
    
    if(encryptionKeyInitialized == true){
        return (
            // sx={{display:"flex"}}
            <Box sx={{broder:"1px"}}>
                <Box className="pagination" sx={{display:"flex"}}>
                <Pagination sx={{marginTop:"10px"}} count={1} showFirstButton showLastButton />
                <IconButton sx={{ml:"800px"}} color="primary" size="large" onClick={()=> setLoading(true) }>
                    <RefreshIcon fontSize="large"/>
                </IconButton>

                </Box>
                
                
                {/* <Button variant="contained" sx={{borderRadius:"30px"}}>
                <RefreshIcon fontSize="large"/>
                </Button> */}

                <Box>
                    {
                        <GetMessages />
                    }
                    
                </Box>


            </Box>
           
        )
    } else if(encryptionKeyInitialized == false){
        return (
            <Stepper onDeboxInitialization={getPublicEncryptionKey}/>
        )
    } else{
        return(
            <div className="spinner">
                <CircularProgress/>
            </div>
        )
    }
}