import React, { useContext, useEffect, useState } from "react";

import ContactsContext from "./Contexts/ContactsContext";

export default function ContactsSetter() {
    const useContacts = () => useContext(ContactsContext);
    const { contacts, setContacts } = useContacts()!;
    const [name, setName] = useState<string>("");
    const [address, setAddress] = useState<string>("");

    const addContact = () => {
        const savedContacts = JSON.parse(localStorage.getItem('contacts') || '{}');

        setContacts([...contacts, {name: name, address: address}])
    }

  return (
    <>
        <input key="name" onChange={(e) => setName(e.currentTarget.value)}/>
        <input key="address" onChange={(e) => setAddress(e.currentTarget.value)}/>
        <button type="button" onClick={addContact}>ADD</button>
    </>
  );
}