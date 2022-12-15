import { Add, SettingsPhoneTwoTone } from "@mui/icons-material";
import { Box, IconButton, Modal } from "@mui/material";
import { useContext, useEffect, useRef, useState } from "react";
import SnackbarNotification from '../components/App/Snackbar';


import ContactsContext from "./Contexts/ContactsContext";

export default function ContactsSetter(props: any) {
    const useContacts = () => useContext(ContactsContext);
    const { contacts, setContacts } = useContacts()!;
    const [name, setName] = useState<string>("");
    const [address, setAddress] = useState<string>(props.props);
    const ref = useRef<any>(null);
    const { onClickOutside } = props;
    const [theme, setTheme] = useState(localStorage.getItem('globalTheme'));
    const [notificationState, setNotificationState] = useState({})
    var found: any;

    const addContact = () => {
        found = contacts.some(e => e.address.toLowerCase() === address.toLowerCase())
        if (!found) {
            contacts.push({name: name, address: address});
            setContacts([...contacts])
            onClickOutside && onClickOutside();
        } else {
            setNotificationState({
                message: "This address is already saved", open: true,
                severity: "error"
            })
        }
    }

    function handleOnCancel() {
        onClickOutside && onClickOutside();
    }

    function handleChange(event: any) {
        if(event.target)
            setAddress(event.target.value)
    }

    useEffect(() => {
        setTheme(localStorage.getItem('globalTheme'));
    });

    useEffect(() => {
        localStorage.setItem('contacts', JSON.stringify(contacts));
    }, [contacts, localStorage]);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (ref.current && !ref.current.contains(event.target)) {
                onClickOutside && onClickOutside();
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [ onClickOutside ]);

    return (
        <>
            <SnackbarNotification state={notificationState} 
                setNotificationState={setNotificationState} />
            <Modal open={props.show}>
                <Box ref={ref} className={`modal-box ${theme === "classic" ? "classic" : "dark"}` }>
                    <form>
                        <div className="add-contact-text">Add Contact</div>
                        <div className="form-group for-field">
                            <label className="for-label">Name</label>
                            <input key="name" className="form-control inputs" placeholder="Type here"
                                onChange={(e) => setName(e.currentTarget.value)}/>
                        </div>
                        <div className="form-group for-field">
                            <label className="for-label">Address</label>
                            { address ?
                                <input readOnly key="address" className="form-control inputs"
                                    value={address}/> :
                                <input key="address" className="form-control inputs" placeholder="Type here" onChange={handleChange} />    
                            }
                        </div>
                        <div className="buttons-container">
                            <button className="btn mt-3 cancel-button" type="button"
                                onClick={() => handleOnCancel()}>
                                Cancel
                            </button>
                            <button className="btn mt-3 add-button" type="button"
                                onClick={addContact}>
                                ADD
                            </button>
                        </div>
                    </form>
                </Box>
            </Modal>
        </>
    );
}