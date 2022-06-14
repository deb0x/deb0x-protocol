import { createContext } from "react";

export const initialContacts = {
    contacts: [{
        name: "Tudor",
        address: "0x845A1a2e29095c469e755456AA49b09D366F0bEB"
    }],
    setContacts: (_values: any) => {}
}

const ContactsContext = createContext(initialContacts);
export default ContactsContext;
