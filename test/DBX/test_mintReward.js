const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/DBX.sol/DBX.json")
const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("Test DBX contract", async function() {
    let dbxERC20;
    beforeEach("Set enviroment", async() => {
        [deployer, add1, add2] = await ethers.getSigners();

        const DBX = await ethers.getContractFactory("DBX");
        dbxERC20 = await DBX.deploy();
        await dbxERC20.deployed();
    });

    it(`Test mintReward function`, async() => {
        let balanceBeforeMintReward = await dbxERC20.balanceOf(deployer.address)
        expect(balanceBeforeMintReward).to.equal(0)
        await dbxERC20.mintReward(deployer.address, ethers.utils.parseEther("100"))
        let balanceAfterMintReward = await dbxERC20.balanceOf(deployer.address)
        expect(balanceAfterMintReward).to.equal(BigNumber.from("100000000000000000000"))

        let balanceBeforeMintRewardAcc2 = await dbxERC20.balanceOf(add1.address)
        expect(balanceBeforeMintRewardAcc2).to.equal(0)
        await dbxERC20.mintReward(add1.address, ethers.utils.parseEther("3000"))
        let balanceAfterMintRewardAcc2 = await dbxERC20.balanceOf(add1.address)
        expect(balanceAfterMintRewardAcc2).to.equal(BigNumber.from("3000000000000000000000"))

        await dbxERC20.mintReward(deployer.address, ethers.utils.parseEther("300"))
        let balanceAfterMintRewardRoundTwo = await dbxERC20.balanceOf(deployer.address)
        expect(balanceAfterMintRewardRoundTwo).to.equal(BigNumber.from("400000000000000000000"))

        await dbxERC20.mintReward(add1.address, ethers.utils.parseEther("300"))
        let balanceAfterMintRewardRoundTwoAcc2 = await dbxERC20.balanceOf(add1.address)
        expect(balanceAfterMintRewardRoundTwoAcc2).to.equal(BigNumber.from("3300000000000000000000"))
    });

    it(`Try mintReward function`, async() => {
        let tryContract = dbxERC20.connect(add1)
        try {
            await tryContract.mintReward(add1.address, ethers.utils.parseEther("100"))
        } catch (error) {
            expect(error.message).to.include("Caller is not Deb0x contract.")
        }

        let tryContractAdd2 = dbxERC20.connect(add2)
        try {
            await tryContractAdd2.mintReward(add1.address, ethers.utils.parseEther("100"))
        } catch (error) {
            expect(error.message).to.include("Caller is not Deb0x contract.")
        }
    });
})