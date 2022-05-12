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

import { encrypt } from '@metamask/eth-sig-util'
import Deb0x from "./ethereum/deb0x"
import { create } from 'ipfs-http-client'
import { Encrypt } from './components/App/Encrypt';
import { Decrypt } from './components/App/Decrypt';
import {Stake} from './components/App/Stake';
import { Governance } from './components/App/Governance';
import { Sent } from './components/App/Sent';
import {Container, Box,Typography} from '@mui/material';
import ThemeProvider from './components/Contexts/ThemeProvider';
import ThemeSetter from './components/ThemeSetter';
import './index.scss';
import axios from 'axios';
import { injected, network } from './connectors';

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
  if (error instanceof NoEthereumProviderError) {
    return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.'
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network."
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
  const { connector, library, chainId, account, active, error } = context

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = useState<any>()
  const [selectedOption, setSelectedOption] = useState('Deb0x')
  useEffect(() => {
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

  return (
    <ThemeProvider>
        <div className="app-container">
        <PermanentDrawer onChange={handleChange} />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {!!error && 
                <h4 style={{ marginTop: '1rem', marginBottom: '0' }}>
                    {getErrorMessage(error)}
                </h4>
            }
        </div>

        
        {
        account ? 
        !!(library && account) && (
            <Box sx={{marginTop: 12}}>
                <ThemeSetter />
                {selectedOption === "Send email" && <Encrypt />}
                {selectedOption === "Deb0x" && <Decrypt account={account}/>}
                {selectedOption === "Stake" && <Stake />}
                {selectedOption === "Governance" && <Governance />}
                {selectedOption === "Sent" && <Sent />}
            </Box>
        ):
            <Box className="home-page-box" sx={{marginTop:40}}>
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
    </ThemeProvider>
  )
}