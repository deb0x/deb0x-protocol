const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const { NumUtils } = require("../utils/NumUtils.ts");

describe("Memory intensive tests: ERC20 supply limit", async function() {

    let userReward, user1Reward, user2Reward, user3Reward, frontend, dbxERC20, totalMinted;
    let user1, user2;
    beforeEach("Set enviroment", async() => {
        [user1, user2, user3, messageReceiver, feeReceiver] = await ethers.getSigners();

        const Deb0x = await ethers.getContractFactory("Deb0x");
        userReward = await Deb0x.deploy(ethers.constants.AddressZero);
        await userReward.deployed();

        const dbxAddress = await userReward.dbx()
        dbxERC20 = new ethers.Contract(dbxAddress, abi, hre.ethers.provider)

        user1Reward = userReward.connect(user1)
        user2Reward = userReward.connect(user2)
        user3Reward = userReward.connect(user3)
        frontend = userReward.connect(feeReceiver)
    })

    it.ignore(`Should test require`, async() => {
        for (let i = 0; i <= 22532; i++) {
            await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
            await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
            await hre.ethers.provider.send("evm_mine")
            try {
                await user1Reward.claimRewards();
            } catch (e) {
                console.log('Claim rewards failed. Probably last day?');
            }
            if (i % 100 == 0) {
                console.log(`Days past: ${i}`);
            }
        }

        console.log(`Last cycle: ${await user1Reward.getCurrentCycle()}`);
        console.log(`Last reward: ${await user1Reward.calculateCycleReward()}`);

        console.log("Rewards should be ended. Adding 10 more sends");
        for (let i = 0; i < 10; i++) {
            await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
            await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
            await hre.ethers.provider.send("evm_mine")
            if (i % 100 == 0) {
                console.log(`Days past: ${i}`);
            }
        }

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let user1Balance = await dbxERC20.balanceOf(user1.address);
        let totalSupply = await dbxERC20.totalSupply();
        expect(user1Balance).to.equal(totalSupply);
    });

    //This test can be use to test require in Deb0xERC20 contract. Require condition must be modified with a value lower than total supply
    it.ignore(`Should test require`, async() => {
        try {
            for (let i = 0; i < 15000; i++) {
                await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
                await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
                await hre.ethers.provider.send("evm_mine")
                await user1Reward.claimRewards();
            }
        } catch (error) {
            expect(error.message).to.include("DBX: max supply already minted");
        }
    });
});