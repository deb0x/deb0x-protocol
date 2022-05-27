import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import Deb0x from "../../ethereum/deb0x"
import {
    Tooltip, List, ListItem, ListItemText, ListItemButton, Typography, Box, 
    CircularProgress,
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
        const [open, setOpen] = useState(false);
        const handleOpen = () => setOpen(true);
        const handleClose = () => setOpen(false);
        const initial = [{
            name: "Tudor",
            address: "0x845A1a2e29095c469e755456AA49b09D366F0bEB"
        }];
        const [contacts, setContacts] = useState<any>(JSON.parse(localStorage.getItem('contacts') || '{}'));
        let temp: any[] = [];

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


        const addContact = () => {
            console.log("CONTACTS1", contacts)
            // setContacts({
            //     [props.index]: props.message.sender
            // })


            temp[temp.length+1] = {"Test": props.message.sender}

            // temp.push({"test": props.message.sender})

            setContacts([...contacts, {"test": props.message.sender}])
            setOpen(false);

        }

        useEffect(() => {
            console.log("CONTACTS2", contacts)

            localStorage.setItem('contacts', JSON.stringify(contacts));
        }, [contacts]);

        useEffect(() => {
            const items = JSON.parse(localStorage.getItem('contacts') || '{}');
            // if (items) {
            //     setContacts(items);
            // }
        }, []);

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
                                                <IconButton onClick={handleOpen}>
                                                    <Add />
                                                </IconButton>
                                                <Modal
                                                    open={open}
                                                    onClose={handleClose}
                                                    aria-labelledby="modal-modal-title"
                                                    aria-describedby="modal-modal-description"
                                                >
                                                    <Box className="modal-box">
                                                        <Typography id="modal-modal-title" variant="h6" component="h2">
                                                            Text in a modal
                                                        </Typography>
                                                        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                                            Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
                                                        </Typography>
                                                        <button type="button" onClick={addContact}>
                                                            Add Contact
                                                        </button>
                                                    </Box>
                                                </Modal>
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
                </Tooltip>
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
                    <Box sx={{ width: '100%', maxWidth: 1080, margin: '0 auto'}}>
                        <div className="row messages-list">
                            <List className="col-md-3 col-sm-12">
                                {fetchedMessages.map((message: any, i: any) => {
                                    return (
                                        <Message message={message} index={i} 
                                            key={i} previousIndex={previousIndex} 
                                            setPreviousIndex={setPreviousIndex} />
                                    )
                                })}
                            </List>
                            <Box className="intro-box col-md-9">
                                <div>
                                    <h2>What is Lorem Ipsum?</h2>
                                    <p>
                                        <strong>Lorem Ipsum</strong> 
                                        is simply dummy text of the printing and typesetting industry. 
                                        Lorem Ipsum has been the industry's standard dummy text ever 
                                        since the 1500s, when an unknown printer took a galley of 
                                        type and scrambled it to make a type specimen book. It has 
                                        survived not only five centuries, but also the leap into 
                                        electronic typesetting, remaining essentially unchanged. 
                                        It was popularised in the 1960s with the release of Letraset 
                                        sheets containing Lorem Ipsum passages, and more recently 
                                        with desktop publishing software like Aldus PageMaker 
                                        including versions of Lorem Ipsum.
                                    </p>
                                    <div id="lipsum">
                                        <ul>
                                            <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
                                            <li>Ut hendrerit eros sit amet nibh vehicula, non commodo nibh imperdiet.</li>
                                            <li>Sed bibendum augue a tortor fringilla viverra.</li>
                                            <li>Sed lobortis urna et dapibus lobortis.</li>
                                            <li>Aenean lacinia neque tincidunt sapien aliquet, in efficitur orci ornare.</li>
                                            <li>Integer ultrices mi interdum elit porta, eget auctor leo auctor.</li>
                                            <li>Praesent sodales urna quis quam molestie pulvinar.</li>
                                            <li>Duis sagittis neque porttitor, mollis tortor dignissim, suscipit felis.</li>
                                            <li>Donec at dui eget elit congue consectetur ac quis erat.</li>
                                        </ul>
                                    </div>
                                </div>
                            </Box>
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