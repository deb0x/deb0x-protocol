import React, { useState, useEffect } from 'react';
import './App.css';
import { Web3ReactProvider, useWeb3React, UnsupportedChainIdError } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected
} from '@web3-react/injected-connector'
import { ethers } from "ethers";
import { injected, network } from './connectors';
import { useEagerConnect, useInactiveListener } from './hooks'
import { PermanentDrawer } from './components/PermanentDrawer'
import { encrypt } from '@metamask/eth-sig-util'
import Deb0x from "./ethereum/deb0x"
import { create } from 'ipfs-http-client'
import { Encrypt } from './components/Encrypt';
import { Decrypt } from './components/Decrypt';
import {Stake} from './components/Stake';
import { Governance } from './components/Governance';
import {Container, Box,Typography} from '@mui/material'


const axios = require('axios')

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'http'
})

const ethUtil = require('ethereumjs-util')
//old address: 0x218c10BAb451BE6A897db102b2f608bC7D3441a0
// 0xf98E2331E4A7a542Da749978E2eDC4a572E81b99
const deb0xAddress = "0xf98E2331E4A7a542Da749978E2eDC4a572E81b99";


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

// function ChainId() {
//   const { chainId } = useWeb3React()

//   return (
//     <>
//       <span>Chain Id</span>
//       <span role="img" aria-label="chain">
//         ⛓
//       </span>
//       <span>{chainId ?? ''}</span>
//     </>
//   )
// }

// function BlockNumber() {
//   const { chainId, library } = useWeb3React()

//   const [blockNumber, setBlockNumber] = React.useState<number>()
//   React.useEffect((): any => {
//     if (!!library) {
//       let stale = false

//       library
//         .getBlockNumber()
//         .then((blockNumber: number) => {
//           if (!stale) {
//             setBlockNumber(blockNumber)
//           }
//         })
//         .catch(() => {
//           if (!stale) {
//             setBlockNumber(null as any)
//           }
//         })

//       const updateBlockNumber = (blockNumber: number) => {
//         setBlockNumber(blockNumber)
//       }
//       library.on('block', updateBlockNumber)

//       return () => {
//         stale = true
//         library.removeListener('block', updateBlockNumber)
//         setBlockNumber(undefined)
//       }
//     }
//   }, [library, chainId]) // ensures refresh if referential identity of library doesn't change across chainIds

//   return (
//     <>
//       <span>Block Number</span>
//       <span role="img" aria-label="numbers">
//         🔢
//       </span>
//       <span>{blockNumber === null ? 'Error' : blockNumber ?? ''}</span>
//     </>
//   )
// }

// function Account() {
//   const { account } = useWeb3React()

//   return (
//     <>
//       <span>Account</span>
//       <span role="img" aria-label="robot">
//         🤖
//       </span>
//       <span>
//         {account === null
//           ? '-'
//           : account
//             ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
//             : ''}
//       </span>
//     </>
//   )
// }

// function Balance() {
//   const { account, library, chainId } = useWeb3React()

//   const [balance, setBalance] = React.useState()
//   React.useEffect((): any => {
//     if (!!account && !!library) {
//       let stale = false

//       library
//         .getBalance(account)
//         .then((balance: any) => {
//           if (!stale) {
//             setBalance(balance)
//           }
//         })
//         .catch(() => {
//           if (!stale) {
//             setBalance(null as any)
//           }
//         })

//       return () => {
//         stale = true
//         setBalance(undefined)
//       }
//     }
//   }, [account, library, chainId]) // ensures refresh if referential identity of library doesn't change across chainIds

//   return (
//     <>
//       <span>Balance</span>
//       <span role="img" aria-label="gold">
//         💰
//       </span>
//       <span>{balance === null ? 'Error' : balance ? `Ξ${ethers.utils.formatEther(balance)}` : ''}</span>
//     </>
//   )
// }

// function Header() {
//   const { active, error } = useWeb3React()


//   return (
//     <>
//       <h1 style={{ margin: '1rem', textAlign: 'right' }}>{active ? '🟢' : error ? '🔴' : '🟠'}</h1>
//       <h3
//         style={{
//           display: 'grid',
//           gridGap: '1rem',
//           gridTemplateColumns: '1fr min-content 1fr',
//           maxWidth: '20rem',
//           lineHeight: '2rem',
//           margin: 'auto'
//         }}
//       >
//         <ChainId />
//         <BlockNumber />
//         <Account />
//         <Balance />
//       </h3>
//     </>
//   )
// }

function App() {
  const context = useWeb3React<ethers.providers.Web3Provider>()
  const { connector, library, chainId, account, active, error } = context

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState<any>()
  const [selectedOption, setSelectedOption] = useState('Deb0x')
  React.useEffect(() => {
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
    <>
      <PermanentDrawer onChange={handleChange} />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>


        {!!error && <h4 style={{ marginTop: '1rem', marginBottom: '0' }}>{getErrorMessage(error)}</h4>}
      </div>

      
      {
      
      account ? 
      !!(library && account) && (
          <Box sx={{marginLeft: 40, marginTop: 10}}>
             {selectedOption === "Send email" && <Encrypt />}
             {selectedOption === "Deb0x" && <Decrypt account={account}/>}
             {selectedOption === "Stake" && <Stake />}
             {selectedOption === "Governance" && <Governance />}
          </Box>
      ):
        <Box className="home-page-box" sx={{marginLeft:30, marginTop:30,}}>
            <Typography sx={{textAlign:"center",color:"gray"}} variant="h1">The End To End Encrypted <br></br>Decentralized Email Protocol <br></br> Owned By Its Users</Typography>
            <Typography sx={{ mt:10,textAlign:"center"}} variant="h3">Please connect your wallet</Typography>
        </Box>
    
    
    
    }


    </>
  )
}