import { createContext } from "react";

export const initialContacts = {
    contacts: [{
        name: "Alex Males",
        address: "0x31dcF3b5F43e7017425E25E5A0F006B6f065c349"
    }],
    setContacts: (_values: any) => {}
}

const ContactsContext = createContext(initialContacts);
export default ContactsContext;
