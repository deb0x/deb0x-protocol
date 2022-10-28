import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { injected } from '../../connectors';
import { useWeb3React } from '@web3-react/core';
import ThemeSetter from '../ThemeSetter';
import { Spinner } from './Spinner';
import { ethers } from 'ethers';
import { useEagerConnect } from '../../hooks';
import { id } from 'ethers/lib/utils';
import formatAccountName from '../Common/AccountName';
import Deb0xERC20 from "../../ethereum/deb0xerc20";
import Popper from '@mui/material/Popper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import '../../componentsStyling/appBar.scss';

const deb0xERC20Address = "0x80f0C1c49891dcFDD40b6e0F960F84E6042bcB6F"
enum ConnectorNames { Injected = 'Injected' };

const connectorsByName: { [connectorName in ConnectorNames]: any } = {
    [ConnectorNames.Injected]: injected
}

export function AppBarComponent(props: any): any {
    const context = useWeb3React();
    const { connector, library, chainId, account, activate, deactivate, active, error } = context
    const [activatingConnector, setActivatingConnector] = useState<any>();
    const [networkName, setNetworkName] = useState<any>();
    const [userUnstakedAmount,setUserUnstakedAmount] = useState<any>(0);
    const triedEager = useEagerConnect();
    const [ensName, setEnsName] = useState<any>("");
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popper' : undefined;

    if(library){
        checkENS();
        setUnstakedAmount();
    }

    useEffect(() => {
        injected.supportedChainIds?.forEach(chainId => 
            setNetworkName((ethers.providers.getNetwork(chainId).name)));
        if (activatingConnector && activatingConnector === connector) {
            setActivatingConnector(undefined)
        }
    }, [activatingConnector, connector]);

    async function setUnstakedAmount() {
        const deb0xERC20Contract = Deb0xERC20(library, deb0xERC20Address)
        if(account){
            const balance = await deb0xERC20Contract.balanceOf(account)
            setUserUnstakedAmount(ethers.utils.formatEther(balance))
        }
    }

    useEffect(() => {
        const deb0xERC20Contract = Deb0xERC20(library, deb0xERC20Address)
        const filterFrom = deb0xERC20Contract.filters.Transfer(account)
        const filterTo =  deb0xERC20Contract.filters.Transfer(null, account)
        deb0xERC20Contract.on(filterFrom, () => {
            setUnstakedAmount()
        })
        deb0xERC20Contract.on(filterTo, () => {
            setUnstakedAmount()
        })

        return () => {
            deb0xERC20Contract.removeAllListeners()
        }
    },[])

    useEffect(() => {
        setUnstakedAmount();
    },[userUnstakedAmount])

    async function checkENS(){
        if(chainId !=137){
            var name = await library.lookupAddress(account);
            if(name !== null)
            {   
                setEnsName(name);
            }
        }
       
    }

    function handleClick (event: React.MouseEvent<HTMLElement>) {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    function handleChange(text: any, index: any) {
        // setSelectedIndex(index)
        // props.onChange(text)
        if(index !== 0)
            localStorage.removeItem('input')
    }
    
    return (
        <>
            <div className="app-bar--top">
                <Box className="main-menu--right">
                {account  ? 
                    <Button variant ="contained"
                            onClick={() => handleChange("Stake", 2)}>
                        {userUnstakedAmount} DBX
                    </Button> : 
                    <></> 
                }
                
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
                                            `Unsupported Network. Switch to ${networkName}` : 
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
                        
                    <ThemeSetter />
                </Box>
            </div>
            <Popper className="popper" id={id} open={open} anchorEl={anchorEl}>
                        <Button 
                            onClick={(event: any) => {
                                handleClick(event)
                                deactivate()
                            }}
                            className="logout-btn">
                            Logout 
                        </Button>
            </Popper>
        </>
    );
}
