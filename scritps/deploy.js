const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    const [deployer] = await ethers.getSigners();
    const Deb0x = await ethers.getContractFactory("Deb0x");
    const deb0x = await Deb0x.deploy(ethers.constants.AddressZero);
    console.log(`Deployed Deb0x at ${deb0x.address}`);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.log(error);
    process.exit(1);
});