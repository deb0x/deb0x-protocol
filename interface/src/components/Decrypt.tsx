import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import Deb0x from "../ethereum/deb0x"
import {
    Tooltip, List, ListItem,
    ListItemText, ListItemButton, Typography, Box, CircularProgress
} from '@mui/material';
import Stepper from './Stepper'
const axios = require('axios')
const deb0xAddress = "0x218c10BAb451BE6A897db102b2f608bC7D3441a0"

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
        const [message, setMessage] = useState(props.message.data)



        async function decryptMessage() {
            const decryptedMessage = await decrypt(message)
            if(decryptedMessage) {
                setMessage(decryptedMessage)
            }
        }

        return (
            <ListItem disablePadding key={props.index}>
                <Tooltip title={(message == props.message.data) ? "Click to decrypt" : ""} placement="right">
                    <ListItemButton onClick={() => {
                        if(message == props.message.data) {
                            decryptMessage()
                        }
                    }}>
                        <ListItemText
                        primary={(message == props.message.data) ? `${message.substring(0,120)}...` : message}/>
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
                return await deb0xContract.fetchMessages(account, sender)
            })

            const cids = await Promise.all(cidsPromises)

            const encryptedMessagesPromisesArray = cids.map(async function(cidArray: any) {
                const encryptedMessagesPromises = cidArray.map(async function (cid: any) {
                    return await fetchMessage(cid)
                })
                const promise = await Promise.all(encryptedMessagesPromises)

                return promise
            })

            const encryptedMessages = await Promise.all(encryptedMessagesPromisesArray)
            
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
                    <Box sx={{ width: '100%', maxWidth: 1080 }}>
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