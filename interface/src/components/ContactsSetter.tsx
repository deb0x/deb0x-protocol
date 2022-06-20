import { Add } from "@mui/icons-material";
import { Box, IconButton, Modal } from "@mui/material";
import { useContext, useEffect, useRef, useState } from "react";

import ContactsContext from "./Contexts/ContactsContext";

export default function ContactsSetter(props: any) {
    const useContacts = () => useContext(ContactsContext);
    const { contacts, setContacts } = useContacts()!;
    const [name, setName] = useState<string>("");
    const [address, setAddress] = useState<string>(props.props);
    const ref = useRef<any>(null);
    const { onClickOutside } = props;

    const addContact = () => {
        contacts.push({name: name, address: address})
        setContacts([...contacts])
        onClickOutside && onClickOutside();
    }

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
            <Modal open={props.show}>
                <Box ref={ref} className="modal-box">
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