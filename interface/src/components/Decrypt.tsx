import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from "ethers";
import Deb0x from "../ethereum/deb0x"
import {
    TextField, Grid, Button, List, ListItem,
    ListItemText, ListItemButton, Typography, Box, CircularProgress
} from '@mui/material';
import Stepper from './Stepper'
const axios = require('axios')
const deb0xAddress = "0x6f5dDD41EAb5E6E3be7B7718b9dF6f2E7576fEd5";

export function Decrypt(props: any): any {
    const { account, library } = useWeb3React()
    const [showSelectPicker, setShowSelectPicker] = useState(false)
    const [msgFromAddress, setMsgFromAddress] = useState('')
    const [currentMessages, setCurrentMessages] = useState([])
    const [encryptionKeyInitialized, setEncryptionKeyInitialized] = useState<boolean|undefined>(undefined)

    useEffect(() => {
        getPublicEncryptionKey()
        getMsgsFromContract()
    }, []);

    const getPublicEncryptionKey = async () => {
        const deb0xContract = Deb0x(library, deb0xAddress)
        const key = await deb0xContract.getKey(account)
        const initialized = (key != '') ? true : false
        console.log(initialized)
        setEncryptionKeyInitialized(initialized)
    }

    async function getMsgsFromContract() {
        setShowSelectPicker(true)
        console.log(ethers.utils.isAddress(msgFromAddress))
        if (ethers.utils.isAddress(msgFromAddress)) {
            const deb0xContract = Deb0x(library, deb0xAddress)
            const messages = await deb0xContract.fetchMessages(account, msgFromAddress)
            console.log(messages)
            setCurrentMessages(messages)
        }
    }

    async function decrypt(encryptedMessage: any) {
        let decryptedMessage
        try {
            decryptedMessage = await library.provider.request({
                method: 'eth_decrypt',
                params: [encryptedMessage, account],
            });
        } catch (error) {
            console.log(error)
        }
        return decryptedMessage
    }

    function selectedMessageNumberLogic(e: any) {
        console.log(e.target.innerText)

    }

    async function fetchMessage(message: any) {
        return await axios.get(`https://ipfs.io/ipfs/${message}`)
    }

    function Message(props: any) {
        const [message, setMessage] = useState(props.message.data)



        async function decryptMessage() {
            const decryptedMessage = await decrypt(message)
            setMessage(decryptedMessage)
        }

        return (
            <ListItem disablePadding key={props.index}>
                <ListItemButton onClick={decryptMessage}>
                    <ListItemText primary={message}  />
                </ListItemButton>
            </ListItem>)
    }

    function GetMessages() {

        const [fetchedMessages, setFetchedMessages] = useState<any>([])

        useEffect(() => {
            processMessages()
        }, []);

        async function processMessages() {
            const processedMessages = currentMessages.map(async (message) => {
                return await fetchMessage(message);
            })
            Promise.all(processedMessages).then(values => {
                console.log(values)
                setFetchedMessages(values)
            })

        }

        if (msgFromAddress == '' || currentMessages.length == 0) {
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
            console.log(currentMessages)
            return (
                <Box sx={{ width: '100%', maxWidth: 1080 }}>
                    <List>
                        {fetchedMessages.map((message: any, i: any) => {
                            return (
                                <Message message={message} index={i} />
                            )
                        })}
                    </List>
                </Box>


                // <select value={selectedMessageNumber} onChange={selectedMessageNumberLogic}>
                //     {currentMessages.map((message, i) => {
                //         return <option key={message} value={i + 1}
                //         >{i + 1}</option>
                //     })}
                // </select>
            )
        }

    }

    if(encryptionKeyInitialized == true){
        return (
            <>
                <Grid container spacing={2}>
                    <Grid item>
                        <TextField id="outlined-basic"
                            label="Sender address"
                            variant="outlined"
                            onChange={e => setMsgFromAddress(e.target.value)}
                        />
                    </Grid>
                    <Grid item>
                        <Button sx={{ top: 5 }} size='large' variant="contained"
                            onClick={() => getMsgsFromContract()}
                            disabled={showSelectPicker == false}
                        >
                            Get messages
                        </Button>
                    </Grid>
                </Grid>
                {
                    showSelectPicker &&
                    <GetMessages />
                }
            </>
        )
    } else if(encryptionKeyInitialized == false){
        return (
            <Stepper onDeboxInitialization={setEncryptionKeyInitialized}/>
        )
    } else {
        return(
            <CircularProgress />
        )
    }
}