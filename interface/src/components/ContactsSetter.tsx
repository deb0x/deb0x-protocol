import { Add } from "@mui/icons-material";
import { Box, IconButton, Modal } from "@mui/material";
import { useContext, useEffect, useState } from "react";

import ContactsContext from "./Contexts/ContactsContext";

export default function ContactsSetter(props: any) {
    const useContacts = () => useContext(ContactsContext);
    const { contacts, setContacts } = useContacts()!;
    const [name, setName] = useState<string>("");
    const [address, setAddress] = useState<string>(props.props);
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);

    const addContact = () => {
        contacts.push({name: name, address: address})
        setContacts([...contacts])
        setOpen(false)
    }

    useEffect(() => {
        localStorage.setItem('contacts', JSON.stringify(contacts));
    }, [contacts, localStorage]);

    return (
        <>
            <IconButton onClick={handleOpen}>
                <Add />
            </IconButton>
            <Modal open={open}>
            <Box className="modal-box">
                <form>
                    <div className="form-group">
                        <label>Name</label>
                        <input key="name" className="form-control"
                            onChange={(e) => setName(e.currentTarget.value)}/>
                    </div>
                    <div className="form-group">
                        <label>Address</label>
                        <input readOnly key="address" className="form-control"
                            value={props.props}/>
                    </div>
                    <button className="btn btn-outline-dark mt-2" type="button" 
                        onClick={addContact}>
                        ADD
                    </button>
                </form>
            </Box>
            </Modal>
        </>
    );
}