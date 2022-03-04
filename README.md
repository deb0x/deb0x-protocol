# deb0x
Decentralized Private Mail Protocol

### Prerequisites
Add `.secrets.json` file in root directory and put your secret phrase as a json format. For example:
```
{
    "mnemonic":"crazy crazy crazy crazy crazy crazy crazy crazy crazy crazy crazy buzz"
}
```

### Basic Commands

Install dependencies `npm install` 

Compile contracts `npx hardhat compile`

Run tests `npm test`

Run scripts `npx hardhat run --network testnet scripts/[your_script].js`

Run tasks `npx hardhat accounts`

### Insight Commands

Generate test coverage report `npx hardhat coverage --testfiles 'test/**/*.js'`

Gas report `REPORT_GAS=true npx hardhat test`

### Deployment
In `.env` file you have to add your deployment script configuration. For example:

Deb0xERC20_ADDRESS = 
Deb0x_ADDRESS = 
Deb0xGovernor_Address = 

```
Run deploy script (BSC testnet)
```
npx hardhat run --network testnet scripts/deploy.js

# Deb0x Contract Addresses 

| Contract name            | Commit hash | BSC Testnet                                 | BSC Mainnet                                |
| ------------------------ | ----------- | ------------------------------------------- | ------------------------------------------ | 
| Deb0xERC20               |  -          |   |  |
| Deb0x                    |  -          |   |  |
| Deb0xGovernor            |  -          |   |  |
