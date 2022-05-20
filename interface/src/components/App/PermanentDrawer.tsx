import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import SendIcon from '@mui/icons-material/Send';
import LockIcon from '@mui/icons-material/Lock';
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import { injected } from '../../connectors';
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

const deb0xERC20Address = "0xEde2f177d6Ae8330860B6b37B2F3D767cd2630fe"
enum ConnectorNames { Injected = 'Injected' };

const connectorsByName: { [connectorName in ConnectorNames]: any } = {
    [ConnectorNames.Injected]: injected
}

export function PermanentDrawer(props: any): any {
    const context = useWeb3React()
    const { connector, library, chainId, account, activate, deactivate, active, error } = context
    const [activatingConnector, setActivatingConnector] = useState<any>()
    const triedEager = useEagerConnect()
    const [selectedIndex, setSelectedIndex] = useState<any>(0);
    const [searchBarValue, setSearchBarValue] = useState<any>("search");
    const [ensName, setEnsName] = useState<any>("");
    // const [balance, setBalance] = useState<any>("8.13");
    const [userUnstakedAmount,setUserUnstakedAmount] = useState<any>(0);
    const menuItems = ['Deb0x', 'Send', 'Stake', 'Sent'];
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popper' : undefined;
    const dimensions = ScreenSize();

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

    function handleChange(text: any, index: any) {
        setSelectedIndex(index)
        props.onChange(text)
    }

    return (

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
                    const currentConnector = connectorsByName[ConnectorNames.Injected]
                    const activating = currentConnector === activatingConnector
                    const connected = currentConnector === connector
                    const disabled = !triedEager || !!activatingConnector || connected || !!error

                    return (
                        <Button variant="contained"
                            key={ConnectorNames.Injected}
                            aria-describedby={id}
                            onClick={!connected ? 
                                () => {
                                    setActivatingConnector(currentConnector)
                                    activate(currentConnector)
                                } : 
                                handleClick
                            }>
                            
                            { activating ? 
                                <Spinner color={'black'} /> :
                                !connected ? 
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
                                className="list-item">
                                <ListItemIcon className="icon" >
                                    {index === 0 && <InboxIcon />}
                                    {index === 1 && <MailIcon />}
                                    {index === 2 && <Gavel />}
                                    {index === 3 && <SendIcon />}
                                </ListItemIcon>
                                <ListItemText className="text" primary={text} />
                            </ListItem>
                        </>
                    ))}
                </List>
                {/* <div className="side-menu--bottom">
                    <div className="content">
                        <a href="https://github.com/deb0x" target="_blank">
                        <GitHubIcon  />
                        </a>
                        <a href="https://www.deb0x.org" target="_blank">
                            www.deb0x.org
                        </a>
                    </div>
                </div> */}
            </Drawer>
        </Box>
    );
}