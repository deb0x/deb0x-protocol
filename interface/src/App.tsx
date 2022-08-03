import { useState, useEffect } from 'react';
import './App.css';
import { 
    Web3ReactProvider,
    useWeb3React,
    UnsupportedChainIdError
} from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected
} from '@web3-react/injected-connector'
import { ethers } from "ethers";
import { useEagerConnect, useInactiveListener } from './hooks'
import { PermanentDrawer } from './components/App/PermanentDrawer'
import { create } from 'ipfs-http-client'
import { Encrypt } from './components/App/Encrypt';
import { Decrypt } from './components/App/Decrypt';
import {Stake} from './components/App/Stake';
import { Sent } from './components/App/Sent';
import { Box,Typography, Fab, Button} from '@mui/material';
import ThemeProvider from './components/Contexts/ThemeProvider';
import './index.scss';
import { injected, network } from './connectors';
import ContactsProvider from './components/Contexts/ContactsProvider';
import elephant from './photos/icons/elephant.svg';
import logoGreen from './photos/icons/logo-green.svg';
import logoDark from "./photos/logo-dark.svg";
import { Spinner } from './components/App/Spinner';

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'http'
})

const ethUtil = require('ethereumjs-util')
//old address: 0x218c10BAb451BE6A897db102b2f608bC7D3441a0
// 0x13dA6EDcdD7F488AF56D0804dFF54Eb17f41Cc61
const deb0xAddress = "0x13dA6EDcdD7F488AF56D0804dFF54Eb17f41Cc61";


enum ConnectorNames { Injected = 'Injected', Network = 'Network' };

const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.Injected]: injected,
  [ConnectorNames.Network]: network
}

function getErrorMessage(error: Error) {
    let networkName;

    injected.supportedChainIds?.forEach(chainId => networkName = (ethers.providers.getNetwork(chainId)).name)
    if (error instanceof NoEthereumProviderError) {
        return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.'
    } else if (error instanceof UnsupportedChainIdError) {
        return `You're connected to an unsupported network. Switch to ${networkName}`
    } else if (
        error instanceof UserRejectedRequestErrorInjected
    ) {
        return 'Please authorize this website to access your Ethereum account.'
    } else {
        console.error(error)
        return 'An unknown error occurred. Check the console for more details.'
    }
}

function getLibrary(provider: any): ethers.providers.Web3Provider {
  const library = new ethers.providers.Web3Provider(provider)

  library.pollingInterval = 12000
  return library
}

export default function () {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <App />
    </Web3ReactProvider>
  )
}

function App() {
    const context = useWeb3React<ethers.providers.Web3Provider>()
    const { connector, library, chainId, account, active, error, activate } = context

    // handle logic to recognize the connector currently being activated
    const [activatingConnector, setActivatingConnector] = useState<any>()
    const [selectedOption, setSelectedOption] = useState('Deb0x');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [networkName, setNetworkName] = useState<any>();
    let errorMsg;

    useEffect(() => {
        injected.supportedChainIds?.forEach(chainId => 
            setNetworkName((ethers.providers.getNetwork(chainId).name)));
        if (activatingConnector && activatingConnector === connector) {
            setActivatingConnector(undefined)
        }
    }, [activatingConnector, connector])

    // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
    const triedEager = useEagerConnect()

    // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
    useInactiveListener(!triedEager || !!activatingConnector)

    function handleChange(newValue: any) {
        setSelectedOption(newValue)
    }

    useEffect(() => {
        localStorage.removeItem('input')
    }, [])

    function handleClick (event: React.MouseEvent<HTMLElement>) {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    useEffect(() => {    
        window.ethereum ?
            window.ethereum.request({method: "eth_requestAccounts"}).then(() => {
                switchNetwork();               
            }).catch((err: any) => displayErrorMsg(err))
            : displayErrorMsg("Please install MetaMask")
        }, [])

    async function switchNetwork() {
        try {
            await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: "0x4"}],
            }).then(
                displayErrorMsg("You have switched to the right network")
            );            
        } catch (switchError) {
            try {
                await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: '0x4', 
                        chainName:'Rinkeby Test Network',
                        rpcUrls:['https://rinkeby.infura.io/v3/'],                   
                        blockExplorerUrls:['https://rinkeby.etherscan.io'],  
                        nativeCurrency: { 
                        symbol:'ETH',   
                        decimals: 18
                        }     
                    }
                    ]});
            } catch (err) {
                displayErrorMsg("Cannot switch to the network");
            }
        }
        
    }

    function displayErrorMsg(error: string) {
        errorMsg = error;
        return errorMsg;
    }  
    return (

    <>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {!!errorMsg &&
            <p className='alert alert-danger position-fixed' style={{ marginTop: '4rem', marginBottom: '0' }}>
                {displayErrorMsg(errorMsg)}
            </p>
        }
    </div>
    <ThemeProvider>
        {
            account ? 
            <ContactsProvider>
                <div className="app-container">
                <PermanentDrawer onChange={handleChange}/>
                {
                account ? 
                !!(library && account) && (
                    <Box className="main-container" sx={{marginTop: 12}}>
                        {selectedOption === "Compose" && <Encrypt />}
                        {selectedOption === "Deb0x" && <Decrypt account={account}/>}
                        {selectedOption === "Stake" && <Stake />}
                        {selectedOption === "Sent" && <Sent />}
                    </Box>
                ):
                    <Box className="home-page-box">
                        <Typography sx={{textAlign:"center",color:"gray"}} variant="h1">
                            The End To End Encrypted 
                            <br></br>
                            Decentralized Email Protocol 
                            <br></br> 
                            Owned By Its Users
                        </Typography>
                        <Typography sx={{ mt:10,textAlign:"center"}} variant="h3">
                            Please connect your wallet
                        </Typography>
                    </Box>
                }
                </div>
            </ContactsProvider> :
            <>
                <div className="app-container p-0">
                    <div className="initial-page">
                        <div className="row">
                            <div className="col-md-7 img-container mr-4">
                                <img className="image--left" src={elephant} />
                                <div className="img-content">
                                    <p>Hey, you!</p>
                                    
                                    <p>To use <img className="content-logo" src={logoGreen} /> you need to have your wallet connected</p>
                                    <div>
                                    { (() =>  {
                                        const currentConnector = connectorsByName[ConnectorNames.Injected]
                                        const activating = currentConnector === activatingConnector
                                        const connected = currentConnector === connector
                                        const disabled = !triedEager || !!activatingConnector || connected || !!error

                                        return (
                                            <Button variant="contained"
                                                key={ConnectorNames.Injected}
                                                // aria-describedby={id}
                                                onClick={!connected ? 
                                                    () => {
                                                        setActivatingConnector(currentConnector)
                                                        activate(currentConnector)
                                                    } : 
                                                    handleClick}
                                                    className="connect-button">
                                                
                                                { activating ? 
                                                    <Spinner color={'black'} /> :
                                                    !connected ? 
                                                        "Connect Wallet" :
                                                        <span>
                                                            {account === undefined ? 
                                                                `Unsupported Network. Switch to ${networkName}` : 
                                                                ''}
                                                        </span>
                                                }
                                            </Button>
                                        )
                                    }) ()}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-5">
                                <div className="text-container">
                                    <img className="dark-logo" src={logoGreen} />
                                    <p>
                                        The End to End Encrypted Decentralized 
                                        Email Protocol <br />
                                        <span className="text-green">
                                            Owned by its Users
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        }
    </ThemeProvider>
    </>
  )
}


