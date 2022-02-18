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
import { Spinner } from './components/Spinner'
import {encrypt} from '@metamask/eth-sig-util'
import Deb0x from "./ethereum/deb0x"
import { use } from 'chai';
const ethUtil = require('ethereumjs-util')
const deb0xAddress = "0x00b53749F753d9e520470A259A7822F69963E5e3";


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

function ChainId() {
  const { chainId } = useWeb3React()

  return (
    <>
      <span>Chain Id</span>
      <span role="img" aria-label="chain">
        ⛓
      </span>
      <span>{chainId ?? ''}</span>
    </>
  )
}

function BlockNumber() {
  const { chainId, library } = useWeb3React()

  const [blockNumber, setBlockNumber] = React.useState<number>()
  React.useEffect((): any => {
    if (!!library) {
      let stale = false

      library
        .getBlockNumber()
        .then((blockNumber: number) => {
          if (!stale) {
            setBlockNumber(blockNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            setBlockNumber(null as any)
          }
        })

      const updateBlockNumber = (blockNumber: number) => {
        setBlockNumber(blockNumber)
      }
      library.on('block', updateBlockNumber)

      return () => {
        stale = true
        library.removeListener('block', updateBlockNumber)
        setBlockNumber(undefined)
      }
    }
  }, [library, chainId]) // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <>
      <span>Block Number</span>
      <span role="img" aria-label="numbers">
        🔢
      </span>
      <span>{blockNumber === null ? 'Error' : blockNumber ?? ''}</span>
    </>
  )
}

function Account() {
  const { account } = useWeb3React()

  return (
    <>
      <span>Account</span>
      <span role="img" aria-label="robot">
        🤖
      </span>
      <span>
        {account === null
          ? '-'
          : account
            ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
            : ''}
      </span>
    </>
  )
}

function Balance() {
  const { account, library, chainId } = useWeb3React()

  const [balance, setBalance] = React.useState()
  React.useEffect((): any => {
    if (!!account && !!library) {
      let stale = false

      library
        .getBalance(account)
        .then((balance: any) => {
          if (!stale) {
            setBalance(balance)
          }
        })
        .catch(() => {
          if (!stale) {
            setBalance(null as any)
          }
        })

      return () => {
        stale = true
        setBalance(undefined)
      }
    }
  }, [account, library, chainId]) // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <>
      <span>Balance</span>
      <span role="img" aria-label="gold">
        💰
      </span>
      <span>{balance === null ? 'Error' : balance ? `Ξ${ethers.utils.formatEther(balance)}` : ''}</span>
    </>
  )
}

function Header() {
  const { active, error } = useWeb3React()
  

  return (
    <>
      <h1 style={{ margin: '1rem', textAlign: 'right' }}>{active ? '🟢' : error ? '🔴' : '🟠'}</h1>
      <h3
        style={{
          display: 'grid',
          gridGap: '1rem',
          gridTemplateColumns: '1fr min-content 1fr',
          maxWidth: '20rem',
          lineHeight: '2rem',
          margin: 'auto'
        }}
      >
        <ChainId />
        <BlockNumber />
        <Account />
        <Balance />
      </h3>
    </>
  )
}

function EncryptDecrypt() {

  const { account, library } = useWeb3React()
  const [encryptionKey, setKey] = useState('')
  const [textToEncrypt, setTextToEncrypt] = useState('')
  const [cipheredText, setCipheredText] = useState('')
  const [encryptionKeyInitialized, setEncryptionKeyInitialized] = useState('')
  const [senderAddress, setSenderAddress] = useState('')
  const [showSelectPicker, setShowSelectPicker] = useState(false)
  const [msgFromAddress, setMsgFromAddress] = useState('')
  const [currentMessages, setCurrentMessages] = useState([])
  const [decryptedMessage, setDecryptedMessage] = useState('')
  const [selectedMessageNumber, setSelectedMessageNumber] = useState(1)

  useEffect(() => {
    if (!encryptionKeyInitialized) {
        getPublicEncryptionKey()
    }
    getMsgsFromContract()
  }, []);

  async function encryptText(messageToEncrypt:any, destinationAddress:any){
    const signer = await library.getSigner(0);

    const deb0xContract = Deb0x(signer, deb0xAddress);

    const destinationAddressEncryptionKey = await deb0xContract.getKey(destinationAddress);
    const encryptedMessage = ethUtil.bufferToHex(
      Buffer.from(
        JSON.stringify(
          encrypt({
              publicKey:destinationAddressEncryptionKey,
              data:messageToEncrypt,
              version:'x25519-xsalsa20-poly1305'
            }
          )
        ),
        'utf8'
      )
    )

    const tx = await deb0xContract.send(destinationAddress, encryptedMessage)

    setCipheredText(encryptedMessage)
  }

  async function initializeDeb0x() {
    const signer = await library.getSigner(0);

    const deb0xContract = Deb0x(signer, deb0xAddress);

    const tx = await deb0xContract.setKey(encryptionKey);

    const receipt = await tx.wait();

    return receipt.transactionHash;
  }

  async function getEncryptionKey(){
    library.provider.request({
      method: 'eth_getEncryptionPublicKey',
      params: [account],
    })
      .then((result: any) => {
        setKey(result);
      });
  }

  const getPublicEncryptionKey = async () => {
    const deb0xContract = Deb0x(library, deb0xAddress)
    const key = await deb0xContract.getKey(account)
    setEncryptionKeyInitialized(key)
  }

  async function getMsgsFromContract() {
    setShowSelectPicker(true)
    if(ethers.utils.isAddress(msgFromAddress)){
      const deb0xContract = Deb0x(library, deb0xAddress)
      const messages = await deb0xContract.fetchMessages(account, msgFromAddress)
      console.log(messages)
      setCurrentMessages(messages)
    }
  }

  async function decrypt(){
    try {
      setDecryptedMessage(await library.provider.request({
        method: 'eth_decrypt',
        params: [currentMessages[selectedMessageNumber - 1], account],
      }));
    } catch (error) {
      console.log(error)
    }
  }

  function selectedMessageNumberLogic(e:any) {
    console.log(e.target.value)
    setSelectedMessageNumber(e.target.value)
  }

  function GetMessages(){
    
    if(msgFromAddress == '' || currentMessages.length == 0) {
      return(
        <>
          <div>
            <p className="info-text text-truncate alert alert-secondary">
              No messages found.
            </p>
          </div>
        </>
      )
    } else{
      return(
        <select value={selectedMessageNumber} onChange={selectedMessageNumberLogic}>
          {currentMessages.map((message, i) =>{
            return <option key={message} value={i + 1}
            >{i + 1}</option>
          })}
        </select>
      )
    }
    
  }

  return (
    <>
      <h4 className="card-title">
                      Encrypt / Decrypt
                    </h4>

                    <button
                      className="btn btn-primary btn-lg btn-block mb-3"
                      id="getEncryptionKeyButton"
                      onClick={getEncryptionKey}
                      disabled={!encryptionKeyInitialized}
                    >
                      {encryptionKeyInitialized ? "Get Encryption Key" : "Encryption key provided"}
                    </button>

                    <p className="info-text text-truncate alert alert-secondary">
                      Encryption key: {encryptionKey}
                    </p>

                    <button
                      className="btn btn-primary btn-lg btn-block mb-3"
                      id="initializeDeb0x"
                      disabled={encryptionKey == ''}
                      onClick={initializeDeb0x}
                    >
                      {encryptionKeyInitialized ? "Initialize Deb0x" : "Deb0x initialized"}
                    </button>

                    <hr />

                    <div id="encrypt-message-form">
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Message to encrypt"
                        id="encryptMessageInput"
                        value={textToEncrypt}
                        onChange={e => setTextToEncrypt(e.target.value)}
                      />

                      <input
                        className="form-control"
                        type="text"
                        placeholder="Destination Address"
                        id="senderAddress"
                        value={senderAddress}
                        onChange={e => setSenderAddress(e.target.value)}
                      />    

                      
                    </div>

                    <br />

                    <button
                        className="btn btn-primary btn-lg btn-block mb-3"
                        id="encryptButton"
                        disabled={textToEncrypt == '' || senderAddress == ''}
                        onClick={() => encryptText(textToEncrypt, senderAddress)}
                       
                      >
                        Encrypt
                    </button>

                    <p className="info-text text-truncate alert alert-secondary">
                      Ciphertext: {cipheredText}
                    </p>

                    <hr />

                    <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
                      <div className="card">
                        <div className="card-body">
                      
                          <p className="info-text alert alert-secondary">
                            Cleartext: {decryptedMessage}
                          </p>

                          {
                          showSelectPicker &&
                          <GetMessages/>
                          }

                          <button
                            className="btn btn-primary btn-lg btn-block mb-3"
                            id="decryptButton"
                            onClick={decrypt}
                            disabled={showSelectPicker == false}
                          >
                            Decrypt
                          </button>

                          

                          <br />
                          <br />

                          <input
                          className="form-control"
                          type="text"
                          placeholder="Messages from address"
                          id="msgFromAddress"
                          value={msgFromAddress}
                          onChange={e => setMsgFromAddress(e.target.value)}
                          />

                          <button
                              className="btn btn-primary btn-lg btn-block mb-3"
                              id="encryptButton"
                              disabled={msgFromAddress == ''}
                              onClick={() => getMsgsFromContract()}
                            
                            >
                              Get Messages
                          </button>

                        
                        
                        </div>
                    </div>
                  </div>
    </>
  )
}

function App() {
  const context = useWeb3React<ethers.providers.Web3Provider>()
  const { connector, library, chainId, account, activate, deactivate, active, error } = context
  
  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState<any>()
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined)
    }
  }, [activatingConnector, connector])

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect()

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector)

  return (
    <>
      <Header />
      <hr style={{ margin: '2rem' }} />
      <div
        style={{
          display: 'grid',
          gridGap: '1rem',
          gridTemplateColumns: '1fr 1fr',
          maxWidth: '20rem',
          margin: 'auto'
        }}
      >
        {(() => {
          const currentConnector = connectorsByName[ConnectorNames.Injected]
          const activating = currentConnector === activatingConnector
          const connected = currentConnector === connector
          const disabled = !triedEager || !!activatingConnector || connected || !!error

          return (
            <button
              style={{
                height: '3rem',
                borderRadius: '1rem',
                borderColor: activating ? 'orange' : connected ? 'green' : 'unset',
                cursor: disabled ? 'unset' : 'pointer',
                position: 'relative'
              }}
              disabled={disabled}
              key={ConnectorNames.Injected}
              onClick={() => {
                setActivatingConnector(currentConnector)
                activate(currentConnector)
              }}
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
                {connected && (
                  <span role="img" aria-label="check">
                    ✅
                  </span>
                )}
              </div>
              {ConnectorNames.Injected}
            </button>
          )
        })()}
        {(() => {
          const currentConnector = connectorsByName[ConnectorNames.Network]
          const activating = currentConnector === activatingConnector
          const connected = currentConnector === connector
          const disabled = !triedEager || !!activatingConnector || connected || !!error


          return (
            <button
              style={{
                height: '3rem',
                borderRadius: '1rem',
                borderColor: activating ? 'orange' : connected ? 'green' : 'unset',
                cursor: disabled ? 'unset' : 'pointer',
                position: 'relative'
              }}
              disabled={disabled}
              key={ConnectorNames.Network}
              onClick={() => {
                setActivatingConnector(currentConnector)
                activate(currentConnector)
              }}
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
                {connected && (
                  <span role="img" aria-label="check">
                    ✅
                  </span>
                )}
              </div>
              {ConnectorNames.Network}
            </button>
          )
        })()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {(active || error) && (
          <button
            style={{
              height: '3rem',
              marginTop: '2rem',
              borderRadius: '1rem',
              borderColor: 'red',
              cursor: 'pointer'
            }}
            onClick={() => {
              deactivate()
            }}
          >
            Deactivate
          </button>
        )}

        {!!error && <h4 style={{ marginTop: '1rem', marginBottom: '0' }}>{getErrorMessage(error)}</h4>}
      </div>

      <hr style={{ margin: '2rem' }} />

      <div
        style={{
          display: 'grid',
          gridGap: '1rem',
          gridTemplateColumns: 'fit-content',
          maxWidth: '20rem',
          margin: 'auto'
        }}
      >
        {!!(library && account) && (

          <section>
            <div className="row d-flex justify-content-center">
              <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-body">
                    <EncryptDecrypt/>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {!!(connector === connectorsByName[ConnectorNames.Network] && chainId) && (
          <button
            style={{
              height: '3rem',
              borderRadius: '1rem',
              cursor: 'pointer'
            }}
            onClick={() => {
              ; (connector as any).changeChainId(chainId === 1 ? 4 : 1)
            }}
          >
            Switch Networks
          </button>
        )}
      </div>
    </>
  )
}