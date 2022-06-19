import React, { useState, useEffect, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import SendIcon from '@mui/icons-material/Send';
import { Add } from '@mui/icons-material';
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import { injected, walletconnect } from '../../connectors';
import { Spinner } from './Spinner'
import { useEagerConnect } from '../../hooks'
import Gavel from '@mui/icons-material/Gavel';
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import logo from "../../photos/logo.png"
import GitHubIcon from '@mui/icons-material/GitHub';
import Deb0xERC20 from "../../ethereum/deb0xerc20"
import { ethers } from "ethers";
import formatAccountName from "../Common/AccountName";
import "../../componentsStyling/permanentDrawer.scss";
import ThemeSetter from '../ThemeSetter';
import ScreenSize from '../Common/ScreenSize';
import ContactsContext from '../Contexts/ContactsContext';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SnackbarNotification from './Snackbar';

const deb0xERC20Address = "0xEde2f177d6Ae8330860B6b37B2F3D767cd2630fe"
enum ConnectorNames { Injected = 'Injected', WalletConnect = 'WalletConnect' };

const connectorsByName: { [connectorName in ConnectorNames]: any } = {
    [ConnectorNames.Injected]: injected,
    [ConnectorNames.WalletConnect]: walletconnect
}

export function PermanentDrawer(props: any): any {
    const context = useWeb3React()
    const { connector, library, chainId, account, activate, deactivate, active, error } = context
    const [activatingConnector, setActivatingConnector] = useState<any>()
    const triedEager = useEagerConnect()
    const [selectedIndex, setSelectedIndex] = useState<any>(1);
    const [searchBarValue, setSearchBarValue] = useState<any>("search");
    const [ensName, setEnsName] = useState<any>("");
    // const [balance, setBalance] = useState<any>("8.13");
    const [userUnstakedAmount,setUserUnstakedAmount] = useState<any>(0);
    const menuItems = ['Compose', 'Deb0x', 'Stake', 'Sent'];
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popper' : undefined;
    const [connectionChoieAnchorEL, setConnectionChoiceAnchorEl] = useState<null | HTMLElement>(null);
    const connectionChoiceOpen = Boolean(connectionChoieAnchorEL);
    const idConnectionChoice = open ? 'simple-popper' : undefined;
    const dimensions = ScreenSize();
    const useContacts = () => useContext(ContactsContext);
    const { contacts, setContacts } = useContacts()!;
    const [notificationState, setNotificationState] = useState({})

    if(library){
        checkENS();
        setUnstakedAmount();
    }

    useEffect(() => {
        if (activatingConnector && activatingConnector === connector) {
            setActivatingConnector(undefined)
        }
    }, [activatingConnector, connector])

    async function setUnstakedAmount() {
        const deb0xERC20Contract = Deb0xERC20(library, deb0xERC20Address)
        if(account){
            const balance = await deb0xERC20Contract.balanceOf(account)
            setUserUnstakedAmount(ethers.utils.formatEther(balance))
        }
    }

    async function checkENS(){
 
        var name = await library.lookupAddress(account);
        if(name !== null)
        {   
            setEnsName(name);
        }
    }

    useEffect(() => {
        setUnstakedAmount();
    },[userUnstakedAmount])

    function handleClick (event: React.MouseEvent<HTMLElement>) {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    function handleConnectionChoieClick (event: React.MouseEvent<HTMLElement>) {
        console.log("click")
        setConnectionChoiceAnchorEl(connectionChoieAnchorEL ? null : event.currentTarget);
    };

    function handleChange(text: any, index: any) {
        setSelectedIndex(index)
        props.onChange(text)
        if(index !== 0)
            localStorage.removeItem('input')
    }

    const [display, setDisplay] = useState();

    function displayAddress(index: any) {
        setNotificationState({});
        display === index ? setDisplay(undefined) : setDisplay(index);
    }

    const event = new CustomEvent('localdatachanged');
    document.dispatchEvent(event);

    return (
        <>
            <SnackbarNotification state={notificationState} 
                setNotificationState={setNotificationState} />
            <Box sx={{ display: 'flex' }}>
                <CssBaseline />
                <AppBar className="app-bar--top">
                    <div className="image-container">
                        <div className="image-overlay"></div>
                        <img src={logo}  />
                    </div>
                    <Box className="main-menu--right">
                    { account  ? 
                        <>
                            <Paper component="form">
                                <InputBase
                                    placeholder="Search messages"
                                    inputProps={{ "aria-label": "search" }}
                                    className="search-input" />
                                <IconButton type="submit" aria-label="search">
                                    <SearchIcon />
                                </IconButton>
                            </Paper>
                            <Button variant ="contained"
                                    onClick={() => handleChange("Stake", 2)}>
                                {userUnstakedAmount} DBX
                            </Button>
                        </>
                        : 
                        null }
                    
                    { (() =>  {
                        return (
                            <Button variant="contained"
                                key={ConnectorNames.WalletConnect}
                                aria-describedby={id}
                                onClick={
                                    !connector ? handleConnectionChoieClick : 
                                    handleClick
                                }>
                                
                                { activatingConnector ? 
                                    <Spinner color={'black'} /> :
                                    !connector ? 
                                        "Connect Wallet" :
                                        <span>
                                            {account === undefined ? 
                                                'Unsupported Network' : 
                                                account ? 
                                                    ensName === "" ? 
                                                        `${formatAccountName(account)}` :
                                                        `${ensName.toLowerCase()} 
                                                        (${formatAccountName(account)})`
                                                : ''}
                                        </span>
                                }
                            </Button>
                        )
                    }) ()}
                    </Box>
                </AppBar>
                <Popper className="popper" id={idConnectionChoice} open={connectionChoiceOpen} anchorEl={connectionChoieAnchorEL}>
                    <List>
                        {(() =>{
                            const currentConnector = connectorsByName[ConnectorNames.Injected]
                            const connected = currentConnector === connector

                            return(
                                <ListItem className="logout">
                                    <Button 
                                        onClick={() => {
                                                setActivatingConnector(currentConnector)
                                                activate(currentConnector)
                                            }}
                                        className="logout-btn">
                                        MetaMask 
                                    </Button>
                                </ListItem>
                            )
                        }) ()}
                        {(() =>{
                            const currentConnector = connectorsByName[ConnectorNames.WalletConnect]
                            const connected = currentConnector === connector

                            return(
                                <ListItem className="logout">
                                    <Button 
                                        onClick={() => {
                                                setActivatingConnector(currentConnector)
                                                activate(currentConnector)
                                            }}
                                        className="logout-btn">
                                        WalletConnect 
                                    </Button>
                                </ListItem>
                            )
                        }) ()}
                    </List>
                </Popper>
                <Popper className="popper" id={id} open={open} anchorEl={anchorEl}>
                    <List>
                        <ListItem className="theme-select">
                            <ThemeSetter />
                        </ListItem>
                        <ListItem className='logout'>
                            <Button 
                                onClick={(event: any) => {
                                    handleClick(event)
                                    deactivate()
                                }}
                                className="logout-btn">
                                Logout 
                            </Button>
                        </ListItem>
                    </List>
                </Popper>
                <Drawer variant="permanent"
                    anchor={dimensions.width > 768 ? 'left' : 'bottom'}
                    className="side-menu">
                    <List >
                        {menuItems.map((text, index) => (
                            <>
                                
                                <ListItem button key={text} 
                                    selected={selectedIndex === index} 
                                    onClick={() => handleChange(text, index)}
                                    className={`list-item ${index === 0 ? "send-item" : ""}` }>
                                    <ListItemIcon className="icon" >
                                        {index === 0 && <Add />}
                                        {index === 1 && <InboxIcon />}
                                        {index === 2 && <Gavel />}
                                        {index === 3 && <SendIcon />}
                                    </ListItemIcon>
                                    <ListItemText className="text" primary={text} />
                                </ListItem>
                            </>
                        ))}
                    </List>
                    
                    <div className="side-menu--bottom">
                        <>
                            <div className="contacts">
                                <List>
                                    <p>Contacts</p>
                                    {
                                        contacts.map((contact: any, index: any) => (
                                                <>
                                                <ListItem button key={contact.name}
                                                    onClick={() => displayAddress(index)}>
                                                    <ListItemText className="text" primary={contact.name} />
                                                </ListItem>
                                                {display == index ? 
                                                    <ListItem className="row contact-item" key={index}>
                                                        <ListItemText className="text col-8" primary={contact.address} />
                                                        <div className="col-4 buttons">
                                                            <IconButton size="small"
                                                                onClick={() => {
                                                                        navigator.clipboard.writeText(contact.address);
                                                                        setNotificationState({
                                                                            message: "Address added to clipboard.",
                                                                            open: true,
                                                                            severity: "success"
                                                                        })
                                                                    }}>
                                                                <ContentCopyIcon fontSize="small"/>
                                                            </IconButton>
                                                            <IconButton size="small"
                                                                onClick={() => {
                                                                    setNotificationState({})
                                                                    localStorage.setItem("input", JSON.stringify(contact.address))
                                                                    handleChange("Compose", 0)
                                                                }}>
                                                                <SendIcon fontSize="small"/>
                                                            </IconButton>
                                                        </div>
                                                    </ListItem>
                                                    : <></>}
                                                </>
                                        ))
                                    }
                                </List>
                            </div>
                            <div className="content">
                                <a href="https://github.com/deb0x" target="_blank">
                                <GitHubIcon  />
                                </a>
                                <a href="https://www.deb0x.org" target="_blank">
                                    www.deb0x.org
                                </a>
                            </div>
                        </>
                    </div>
                </Drawer>
            </Box>
        </>
    );
}