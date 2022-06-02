import { createContext } from "react";

export const initialContacts = {
    contacts: [{
        name: "Tudor",
        address: "test"
    }],
    setContacts: (_values: any) => {}
}

const ContactsContext = createContext(initialContacts);
export default ContactsContext;