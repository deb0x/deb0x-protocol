require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");

const { mnemonic } = require('./.secrets.json')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.16",

  networks: {
    hardhat: {
      gas: 19000000,
      allowUnlimitedContractSize: true,
      timeout: 1800000
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/c3bf17f85f294d4ca2c90febc415ee52",
      chainId: 4,
      accounts: { mnemonic: mnemonic },
      gas: 1200000000,
      blockGasLimit:3000000000,
      allowUnlimitedContractSize: true,
      timeout: 1800000
    }
  }
};
