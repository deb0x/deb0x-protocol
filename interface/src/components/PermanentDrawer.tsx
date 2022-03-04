import React, { useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail'
import LockIcon from '@mui/icons-material/Lock';
import GavelIcon from '@mui/icons-material/Gavel';
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import { injected } from '../connectors';
import { Spinner } from './Spinner'
import { useEagerConnect } from '../hooks'
import Gavel from '@mui/icons-material/Gavel';

enum ConnectorNames { Injected = 'Injected' };

const connectorsByName: { [connectorName in ConnectorNames]: any } = {
    [ConnectorNames.Injected]: injected
}

const drawerWidth = 240;

export function PermanentDrawer(props: any): any {
    const context = useWeb3React()
    const { connector, library, chainId, account, activate, deactivate, active, error } = context

    const [activatingConnector, setActivatingConnector] = React.useState<any>()
    React.useEffect(() => {
        if (activatingConnector && activatingConnector === connector) {
            setActivatingConnector(undefined)
        }
    }, [activatingConnector, connector])

    const triedEager = useEagerConnect()

    function handleChange(text: any) {
        props.onChange(text)
    }

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popper' : undefined;

    return (

        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, zIndex:1 }}
            >
                <Toolbar>
                    {(() => {
                        const currentConnector = connectorsByName[ConnectorNames.Injected]
                        const activating = currentConnector === activatingConnector
                        const connected = currentConnector === connector
                        const disabled = !triedEager || !!activatingConnector || connected || !!error
                        console.log(account)
                        return (
                            <Button variant="contained" color="warning"
                                sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `1400px` }}

                                key={ConnectorNames.Injected}
                                aria-describedby={id}
                                onClick={!connected ? () => {
                                    setActivatingConnector(currentConnector)
                                    activate(currentConnector)
                                } : handleClick
                                }
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '0',
                                        left: '0',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: 'black',
                                        margin: '0 0 0 1rem'
                                    }}
                                >
                                    {activating && <Spinner color={'black'} style={{ height: '25%', marginLeft: '-1rem' }} />}

                                </div>

                                {!connected ? "Connect Wallet" :
                                    <span>
                                        {account === undefined
                                            ? 'Unsupported Network'
                                            : account
                                                ? `${account.substring(0, 5)}...${account.substring(account.length - 4)}`
                                                : ''}
                                    </span>
                                }
                            </Button>

                        )
                    })()}

                </Toolbar>

            </AppBar>
            <Popper id={id} open={open} anchorEl={anchorEl}>
                <Button variant="contained"
                sx={{top:15}}
                onClick={(event: any) => {
                    handleClick(event)
                    deactivate()
                }}
                >
                    Logout
                </Button>

            </Popper>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
                variant="permanent"
                anchor="left"
            >
                <Toolbar />
                <Divider />
                <List >
                    {['Deb0x', 'Send email', 'Stake', 'Governance'].map((text, index) => (
                        <ListItem button key={text} onClick={() => handleChange(text)}>
                            <ListItemIcon >
                                {index === 0 && <MailIcon />}
                                {index === 1 && <InboxIcon />}
                                {index === 2 && <LockIcon />}
                                {index === 3 && <Gavel />}
                            </ListItemIcon>
                            <ListItemText primary={text} />
                        </ListItem>
                    ))}
                </List>
                <Divider />
            </Drawer>

        </Box>
    );
}