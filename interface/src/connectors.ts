
import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '@web3-react/network-connector'

const POLLING_INTERVAL = 12000
const RPC_URLS: { [chainId: number]: string } = {
    4: 'https://rinkeby.infura.io/v3/84842078b09946638c03157f83405213'
}

export const injected = new InjectedConnector({ supportedChainIds: [4] })

export const network = new NetworkConnector({
    urls: { 4: RPC_URLS[4] },
    defaultChainId: 4
  })