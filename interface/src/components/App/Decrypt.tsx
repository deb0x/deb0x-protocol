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
    const savedContacts = JSON.parse(localStorage.getItem('contacts') || 'null'); 


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
        let [show, setShow] = useState(false);

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

        function checkSenderInLocalStorage(sender: any) {
            let user = '';

            if (ensName !== "") {
                user = ensName;
            } else {
                savedContacts.forEach((contact: any) => {
                    if (sender == contact.address) {
                        user = contact.name;
                    } else {
                        user = formatAccountName(
                            props.message.sender
                        )
                    }
                })
            }

            return user;
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
                                        {
                                            checkSenderInLocalStorage(props.message.sender)
                                        }
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
                                                    {
                                                        checkSenderInLocalStorage(props.message.sender)
                                                    }
                                                </strong>
                                            </p>
                                            <>
                                                <IconButton onClick={() => setShow(true)}>
                                                    <Add />
                                                </IconButton>
                                                <ContactsSetter show={show} props={props.message.sender} onClickOutside={() => setShow(false)}/>
                                            </>
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
                                    <div className="row">
                                        <div className="col-6">
                                            <h2>The End To End Encrypted...</h2>
                                            <p>
                                                Leverages the greatest social repository of public key cryptography to 
                                                enable the ability to send encrypted messages to any person that owns 
                                                an Ethereum address or ENS domain name. This way it makes end to end 
                                                message encryption a practical, built-in feature that is accessible 
                                                to any wallet owner (like Metamask, Trustwallet and others).
                                            </p>
                                        </div>
                                        <div className="col-6">
                                            <img src={ lock }/>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-6">
                                            <img src={ airplane }/>
                                        </div>
                                        <div className="col-6">
                                            <h2>Decentralized Email Protocol...</h2>
                                            <p>
                                            There is no centralized place of control that can censor deb0x email 
                                            transmission. The immutable smart contract implementation of the 
                                            protocol inherits the security and decentralization of the blockchain 
                                            that it is deployed to. At the same time, the pluggable storage 
                                            architecture and multiple incentivized frontend providers offer 
                                            various options for degrees of privacy and usability to the end users.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-6">
                                            <h2>Owned By Its Users!</h2>
                                            <p>
                                                All deb0x users earn tokens that represent equity and revenue share for 
                                                future programmed usage fees of the protocol. Thanks to the distribution 
                                                curve, adopters earn more tokens the earlier they use the protocol. 
                                                The frontend application builders are also incentivised, while the 
                                                referral scheme creates an attractive token earning context that 
                                                drives the overall deb0x protocol adoption.
                                            </p>
                                        </div>
                                        <div className="col-6">
                                            <img src={ users }/>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-6">
                                            <img src={ hand }/>
                                        </div>
                                        <div className="col-6">
                                            <h2>... and there are</h2>
                                            <p>
                                                no premines, no treasury allocations, no private sales, no dev fees! The 
                                                token distribution algorithm is pre-programmed and can never be changed. 
                                                The launch date that will kick off the rewards will be announced one to 
                                                two weeks in advance on this page.
                                            </p>
                                        </div>
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