import { Add, SettingsPhoneTwoTone } from "@mui/icons-material";
import { Box, IconButton, Modal } from "@mui/material";
import { useContext, useEffect, useRef, useState } from "react";
import icon1 from '../photos/icons/icon-1.png';
import icon2 from '../photos/icons/icon-2.png';
import icon3 from '../photos/icons/icon-3.png';
import logoDark from "../photos/logo-dark.svg";
import iconParty from "../photos/party-popper.png"

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
                    <div className="how-to-use-list">
                        <a href="#" onClick={() => handleOnCancel()} className="close-popup">x</a>
                        <h3>Before connecting to <img src={logoDark} />, make sure you:</h3>
                        <ul>
                            <li>
                                <img src={icon1} />
                                <h4>Install <span>MetaMask extension</span> from official website</h4>
                                <a href="https://metamask.io/" target="_blank">https://metamask.io/</a>
                            </li>
                            <li>
                                <img src={icon2} />
                                <h4>Switch to <span>Goerli testnet</span> network</h4>
                                <a href="https://blog.cryptostars.is/goerli-g%C3%B6rli-testnet-network-to-metamask-and-receiving-test-ethereum-in-less-than-2-min-de13e6fe5677" target="_blank">Read more</a>
                            </li>
                            <li>
                                <img src={icon3} />
                                <h4>Get <span>Goerli testnet</span> funds</h4>
                                <a href="https://goerlifaucet.com/" target="_blank">https://goerlifaucet.com/</a>
                            </li>
                        </ul>
                        <h4>After all these steps, you should be ready to use demo.deb0x.org <img src={iconParty} /></h4>
                   </div>
                </Box>
            </Modal>
        </>
    );
}