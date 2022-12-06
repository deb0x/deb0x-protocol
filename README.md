# deb0x
Decentralized Private Mail App and Protocol

### Prerequisites
* npm 6.14+
* node v14.17+
* [Metamask.io](https://metamask.io) browser extension
* Get goerli testnet ETH from a faucet (e.g. https://goerlifaucet.com/)

### Steps to run the frontend

1. `npm install` in root dir
2. `npx hardhat compile` in root dir
3. `cd interface` and then `npm install`
4. `npm start`
5. open http://localhost:3000

For a quick overview and explanations, see the demo video: https://youtu.be/8coLe-z6jHg 

Try out the deployed app: https://demo.deb0x.org/

### To redeploy the contracts
_The contracts for the hackathon version are already deployed and the frontend is linked to it. You only need to do the below steps if you want to change the functionality!_

Add `.secrets.json` file in root directory and put your secret phrase as a json format. For example:
```
{
    "mnemonic":"crazy crazy crazy crazy crazy crazy crazy crazy crazy crazy crazy buzz"
}
```

Run deploy script (Goerli testnet)
```
npx hardhat run --network goerli scritps/deploy.js
```

### run solhint
1. `npm install` 
2. `npx hardhat check`


# Deb0x Contract Addresses 

| Contract name            | Commit hash | Staging                               | Mainnet                                    |
| ------------------------ | ----------- | -------------------------------------------  | ------------------------------------------ | 
| Forwarder                |  006a9ec    |0x30782c020FE90614f08a863B41CbB07A2D2D94fF                                            |                                            |
| Deb0x                    |  29d18d6    | 0xAEC85ff2A37Ac2E0F277667bFc1Ce1ffFa6d782A|                                        |
| Deb0xERC20               |  ab8d403    | 0x24b8cd32f93aC877D4Cc6da2369d73a6aC47Cb7b|                                        |
| Deb0xView                |  437f608    | 0xf4661D0776Ee5171956b25417F7E320fE365C21E   |                                        |                                            
