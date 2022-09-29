
import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '@web3-react/network-connector'

// const POLLING_INTERVAL = 12000
const RPC_URLS: { [chainId: number]: string } = {
    5: 'https://goerli.infura.io/v3/c4174820658a4db9a6e5d54efec43ede'
}

export const injected = new InjectedConnector({ supportedChainIds: [5] })

export const network = new NetworkConnector({
    urls: { 5: RPC_URLS[5] },
    defaultChainId: 5
  })