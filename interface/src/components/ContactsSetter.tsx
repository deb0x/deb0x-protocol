import { useContext, useEffect, useState } from "react";

import ContactsContext from "./Contexts/ContactsContext";

export default function ContactsSetter(props: any) {
    const useContacts = () => useContext(ContactsContext);
    const { contacts, setContacts } = useContacts()!;
    const [name, setName] = useState<string>("");
    const [address, setAddress] = useState<string>(props.props);

    const addContact = () => {
        contacts.push({name: name, address: address})
        setContacts([...contacts])
    }
  
    useEffect(() => {
        localStorage.setItem('contacts', JSON.stringify(contacts));
    }, [contacts, localStorage]);

    return (
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
            <button className="btn btn-outline-dark mt-2" type="button" onClick={addContact}>
                ADD
            </button>
        </form>
    );
}