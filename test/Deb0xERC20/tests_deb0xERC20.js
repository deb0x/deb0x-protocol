const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("Test Deb0xERC20 contract", async function() {
    beforeEach("Set enviroment", async() => {
        [deployer] = await ethers.getSigners();

        const Deb0xERC20 = await ethers.getContractFactory("Deb0xERC20");
        erc20 = await Deb0xERC20.deploy(deployer.address);
        await erc20.deployed();
    });

    it(`Test balanceOf function after deploy`, async() => {
        let actualBalanceForDeployer = await erc20.balanceOf(deployer.address)
        expect(actualBalanceForDeployer).to.equal(ethers.utils.parseEther("1000000"))
    });

})