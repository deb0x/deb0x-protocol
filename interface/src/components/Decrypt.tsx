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

const axios = require('axios')
const deb0xAddress = "0xD88efe6C4f231cE03EE9f71EA53a7E0028751Ecf"

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
        //const [sender, setSender] = useState(props.messsage.sender)

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
                <IconButton  onClick={()=>{hideMessage()}}  edge="end" aria-label="comments">
                { (message != props.message.fetchedMessage.data) ? <VisibilityOffIcon  />: null}
              </IconButton>  
            }
            >
                <Tooltip title={(message == props.message.fetchedMessage.data) ? "Click to decrypt" : `Sender:${props.message.sender}`} placement="right">
                    <ListItemButton onClick={() => {
                        if(message == props.message.fetchedMessage.data) {
                            decryptMessage()
                        }
                    }}>
                        <ListItemText
                        primary={ `${props.message.sender.substring(0, 5)} ... ${props.message.sender.substring(props.message.sender.length - 4)}:  
                        
                        ${(message == props.message.fetchedMessage.data) ? `${message.substring(0,95)}...` : message }
                            `
                         }/>
                         
                    </ListItemButton>
                </Tooltip>
            </ListItem>)
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
                        <div >
                            <Typography variant="h5"
                                gutterBottom
                                component="div"
                                sx={{marginLeft: .8, marginTop: 3}}
                            >
                                No messages found.
                            </Typography>
                        </div>
                    </>
                )
            } else {
                return (
                    <Box sx={{ width: '100%', maxWidth: 1080}}>
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
                <CircularProgress/>
            )
        }

    }
    
    if(encryptionKeyInitialized == true){
        return (
            <>
                {
                    <GetMessages />
                }
            </>
        )
    } else if(encryptionKeyInitialized == false){
        return (
            <Stepper onDeboxInitialization={getPublicEncryptionKey}/>
        )
    } else{
        return(
            <CircularProgress/>
        )
    }
}