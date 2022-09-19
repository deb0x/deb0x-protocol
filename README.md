# deb0x
Decentralized Private Mail App and Protocol

### Prerequisites
* npm 6.14+
* node v14.17+
* [Metamask.io](https://metamask.io) browser extension
* Get rinkeby testnet ETH from a faucet (e.g. https://faucet.rinkeby.io/)

### Steps to run the frontend

1. `npm install` in root dir
2. `cd interface` and then `npm install`
3. `npm start`
4. open http://localhost:3000/

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

Run deploy script (Rinkeby testnet)
```
npx hardhat run --network rinkeby scritps/deploy.js
```

# Deb0x Contract Addresses 

| Contract name            | Commit hash | Rinkeby Testnet                                 | Mainnet                                |
| ------------------------ | ----------- | ------------------------------------------- | ------------------------------------------ | 
| Deb0xERC20               |  -          | 0x98583dd5310725eBDFd1123CA1FDE765Ef6eAFb8 |  |
| Deb0x                    |  -          | 0xb6057a156D1D5BAB08DAb590dC052B66051394e2  |  |

