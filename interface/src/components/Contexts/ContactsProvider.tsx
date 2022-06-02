import { useState, useEffect } from "react";
import ContactsContext, { initialContacts } from './ContactsContext';

type Props = {
    children: JSX.Element|JSX.Element[],
};

const ContactsProvider = ( { children }: Props ) => {
    const [contacts, setContacts] = useState<any>(initialContacts.contacts);
  
    const localStorage = window.localStorage;
  
    useEffect(() => {
        const savedContacts = JSON.parse(localStorage.getItem('contacts') || '{}');
        
        if (!!savedContacts) {
            setContacts([...contacts, savedContacts]);
        }
      
        console.log("Saved", savedContacts);
    }, [localStorage]);
  
    useEffect(() => {
        localStorage.setItem('contacts', JSON.stringify(contacts));
    }, [contacts, localStorage]);
  
    return (
      <ContactsContext.Provider value={{ contacts, setContacts }}>
        <div>{children}</div>
      </ContactsContext.Provider>
    );
  };
  
  export default ContactsProvider;