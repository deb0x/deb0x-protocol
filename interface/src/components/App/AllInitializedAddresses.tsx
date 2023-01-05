import { IconButton } from "@mui/material";
import { useEffect, useState } from "react";
import { getInitializedAddresses } from "../../ethereum/EventLogsMoralis";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import "../../componentsStyling/addresses.scss";
import SnackbarNotification from "./Snackbar";
import { useWeb3React } from "@web3-react/core";

export function AllInitializedAddresses(props: any) {
    const { chainId, library } = useWeb3React()
    const [addresses, setAddresses] = useState([]);
    const min = 1;
    const max = 50;
    const [, setSelectedIndex] = useState<any>();
    const [notificationState, setNotificationState] = useState({});
    const [ensName,setEnsName] = useState("");
    const savedContacts = JSON.parse(localStorage.getItem('contacts') || 'null');
        
    useEffect(() => {
        getAddresses();
        checkENS();
    }, [])

    async function getAddresses() {
        await getInitializedAddresses().then((result: any) => setAddresses(result))
    }

    function handleChange(text: any, index: any) {
        setSelectedIndex(index)
        props.onChange(text)
        if(index !== 0)
            localStorage.removeItem('input')
    }

    async function checkENS() {
        if(chainId !=137){
            let name = await library.lookupAddress(props.message.sender);
            if(name !== null) {   
                setEnsName(name);
            }
        }
    }

    function checkAddressInLocalStorage(address: any) {
        let user: any;

        if (ensName !== "") {
            user = ensName;
        } else {
            savedContacts.map((contact: any) => {
                if (address == (contact.address).toLowerCase()) {
                    user = true;
                }
            })
        }

       return user;
    }

    return (
        <>
            <SnackbarNotification state={notificationState} 
                setNotificationState={setNotificationState} />
            <div className="content-box">
                <div className="addresses-heading">
                    <p>Total users in DBX community: </p>
                    <h2>{addresses.length}</h2>
                </div>
                <div>
                    {addresses && addresses.map(address => (  
                        <div className="address-container"> 
                            <div className="details">
                                <img width="30px" height="30px" 
                                    src={require(`../../photos/icons/avatars/animal-${(Math.floor(Math.random() * (max - min + 1)) + min)}.svg`).default} 
                                    alt="avatar"/> 
                                <span className="address">{address}</span>
                                {
                                    checkAddressInLocalStorage(address) ?
                                        <span> -&nbsp;
                                        {savedContacts.filter((contact: any) => address == (contact.address).toLowerCase())
                                            .map((filteredPerson: any) => (
                                                filteredPerson.name
                                            ))}
                                        </span> :
                                        null
                                }
                                
                            </div>
                            <div className="buttons">
                                <IconButton size="small"
                                    onClick={() => {
                                            navigator.clipboard.writeText(address);
                                            setNotificationState({
                                                message: "Address added to clipboard.",
                                                open: true,
                                                severity: "success"
                                            })
                                        }}>
                                    <ContentCopyIcon className="copy-icon" fontSize="small"/>
                                </IconButton>
                                <IconButton size="small"
                                    onClick={() => {
                                        // setNotificationState({})
                                        localStorage.setItem("input", JSON.stringify(address));
                                        if (document.querySelector(".editor")) {
                                            (document.querySelector(".editor") as HTMLElement).click();
                                        } else {
                                            handleChange("Compose", 0)
                                        }
                                    }}>
                                    <SendIcon className="send-icon" fontSize="small"/>
                                </IconButton>
                            </div>  
                        </div>  
                    ))}  
                </div>
            </div>
        </>
        
    )
}