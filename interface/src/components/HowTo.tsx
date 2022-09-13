import { Add, SettingsPhoneTwoTone } from "@mui/icons-material";
import { Box, IconButton, Modal } from "@mui/material";
import { useContext, useEffect, useRef, useState } from "react";
import icon1 from '../photos/icons/icon-1.png';
import icon2 from '../photos/icons/icon-2.png';
import icon3 from '../photos/icons/icon-3.png';

export default function HowTo(props: any) {
    const [name, setName] = useState<string>("");
    const [address, setAddress] = useState<string>(props.props);
    const ref = useRef<any>(null);
    const { onClickOutside } = props;
    const [theme, setTheme] = useState(localStorage.getItem('globalTheme'));

    function handleOnCancel() {
        onClickOutside && onClickOutside();
    }

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
            <Modal open={props.show} className="initial-page-popup">
                <Box ref={ref} className={`modal-box ${theme === "classic" ? "classic" : "dark"}` }>
                   
                </Box>
            </Modal>
        </>
    );
}