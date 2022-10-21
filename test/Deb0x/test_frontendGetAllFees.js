const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { ContractFunctionVisibility } = require("hardhat/internal/hardhat-network/stack-traces/model");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const { NumUtils } = require("../utils/NumUtils.ts");

describe("Test DBX tokens distributions", async function() {
    let userReward, user1Reward, user2Reward, user3Reward, frontend, dbxERC20;
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

    it(`Test frontend recieve partial reward`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let firstDayReward = NumUtils.day(1);

        let expectedValueForUser1Cycle1 = BigNumber.from("45000000000000000000").mul(BigNumber.from(firstDayReward)).div(BigNumber.from("100000000000000000000"))
        await user1Reward.claimRewards();
        let user1BalanceCycle1 = await dbxERC20.balanceOf(user1.address);
        expect(expectedValueForUser1Cycle1).to.equal(user1BalanceCycle1);

        let expectedValueForUser2Cycle1 = BigNumber.from("45000000000000000000").mul(BigNumber.from(firstDayReward)).div(BigNumber.from("100000000000000000000"))
        await user2Reward.claimRewards();
        let user2BalanceCycle1 = await dbxERC20.balanceOf(user2.address);
        expect(expectedValueForUser2Cycle1).to.equal(user2BalanceCycle1);

        let expectedValueForFrontendCycle1 = BigNumber.from("10000000000000000000").mul(BigNumber.from(firstDayReward)).div(BigNumber.from("100000000000000000000"))
        await frontend.claimFrontEndRewards();
        let frontBalanceCycle1 = await dbxERC20.balanceOf(feeReceiver.address);
        expect(expectedValueForFrontendCycle1).to.equal(frontBalanceCycle1);

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let secondDayReward = NumUtils.day(2);

        let expectedValueForUser1Cycle2 = BigNumber.from("22500000000000000000").mul(BigNumber.from(secondDayReward)).div(BigNumber.from("100000000000000000000"));
        await user1Reward.claimRewards();
        let user1BalanceCycle2 = await dbxERC20.balanceOf(user1.address);
        expect(BigNumber.from(user1BalanceCycle1).add(BigNumber.from(expectedValueForUser1Cycle2))).to.equal(user1BalanceCycle2);

        let expectedValueForUser2Cycle2 = BigNumber.from("22500000000000000000").mul(BigNumber.from(secondDayReward)).div(BigNumber.from("100000000000000000000"))
        await user2Reward.claimRewards();
        let user2BalanceCycle2 = await dbxERC20.balanceOf(user2.address);
        expect(BigNumber.from(user1BalanceCycle1).add(BigNumber.from(expectedValueForUser2Cycle2))).to.equal(user2BalanceCycle2);

        let expectedValueForUser3Cycle2 = BigNumber.from("45000000000000000000").mul(BigNumber.from(secondDayReward)).div(BigNumber.from("100000000000000000000"))
        await user3Reward.claimRewards();
        let user3BalanceCycle2 = await dbxERC20.balanceOf(user3.address);
        // 1 wei difference 
        // expect(expectedValueForUser3Cycle2).to.equal(user3BalanceCycle2);

        let expectedValueForFrontendCycle2 = BigNumber.from("10000000000000000000").mul(BigNumber.from(secondDayReward)).div(BigNumber.from("100000000000000000000"));
        await frontend.claimFrontEndRewards();
        let frontBalanceCycle2 = await dbxERC20.balanceOf(feeReceiver.address);
        expect(BigNumber.from(expectedValueForFrontendCycle2).add(BigNumber.from(frontBalanceCycle1))).to.equal(frontBalanceCycle2);

    });

    it(`Test frontend recieve all reward`, async() => {
        for (let i = 0; i < 13; i++) {
            await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
                feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        }
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let firstDayReward = NumUtils.day(1);
        console.log("Reward ciclu 1")
        console.log(firstDayReward)

        try {
            await user2Reward.claimRewards();
        } catch (error) {
            expect(error.message).to.include("Deb0x: You do not have rewards");
        }
        let user2BalanceCycle1 = await dbxERC20.balanceOf(user2.address);
        console.log("Balanta user2 ciclul 1:")
        console.log(user2BalanceCycle1)
        expect(user2BalanceCycle1).to.equal(0);

        try {
            await user1Reward.claimRewards();
        } catch (error) {
            expect(error.message).to.include("Deb0x: You do not have rewards");
        }
        let user1BalanceCycle1 = await dbxERC20.balanceOf(user1.address);
        console.log("Balanta user1 ciclul 1:")
        console.log(user1BalanceCycle1)
        expect(user1BalanceCycle1).to.equal(0);

        await frontend.claimFrontEndRewards();
        let frontBalanceCycle1 = await dbxERC20.balanceOf(feeReceiver.address);
        // expect(firstDayReward).to.equal(frontBalanceCycle1);

    });

    it.only(`Test frontend recieve all reward`, async() => {
        for (let i = 0; i <= 2; i++) {
            await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
                feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        }
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let firstDayReward = NumUtils.day(1);
        console.log("Reward ciclu 1")
        console.log(firstDayReward)
        try {
            await user2Reward.claimRewards();
        } catch (error) {
            expect(error.message).to.include("Deb0x: You do not have rewards");
        }
        let user2BalanceCycle1 = await dbxERC20.balanceOf(user2.address);
        console.log("Balanta user2 ciclul 1:")
        console.log(user2BalanceCycle1)
        expect(user2BalanceCycle1).to.equal(0);

        try {
            await user1Reward.claimRewards();
        } catch (error) {
            expect(error.message).to.include("Deb0x: You do not have rewards");
        }
        let user1BalanceCycle1 = await dbxERC20.balanceOf(user1.address);
        console.log("Balanta user1 ciclul 1:")
        console.log(user1BalanceCycle1)
        expect(user1BalanceCycle1).to.equal(0);

        await frontend.claimFrontEndRewards();
        let frontBalanceCycle1 = await dbxERC20.balanceOf(feeReceiver.address);
        // expect(firstDayReward).to.equal(frontBalanceCycle1);

    });

    it(`Test frontend recieve all reward`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let firstDayReward = NumUtils.day(1);
        console.log("Reward ciclu 1")
        console.log(firstDayReward)
        try {
            await user1Reward.claimRewards();
        } catch (error) {
            expect(error.message).to.include("Deb0x: You do not have rewards");
        }
        let user1BalanceCycle1 = await dbxERC20.balanceOf(user1.address);
        expect(user1BalanceCycle1).to.equal(0);

        try {
            await user2Reward.claimRewards();
        } catch (error) {
            expect(error.message).to.include("Deb0x: You do not have rewards");
        }
        let user2BalanceCycle1 = await dbxERC20.balanceOf(user2.address);
        console.log("Balanta user2 ciclul 1 : ");
        console.log(user2BalanceCycle1)
            // expect(user2BalanceCycle1).to.equal(0);

        await frontend.claimFrontEndRewards();
        let frontBalanceCycle1 = await dbxERC20.balanceOf(feeReceiver.address);
        // expect(firstDayReward).to.equal(frontBalanceCycle1);

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let secondDayReward = NumUtils.day(2);
        console.log("Reward ciclu 2")
        console.log(secondDayReward)
        try {
            await user3Reward.claimRewards();
        } catch (error) {
            expect(error.message).to.include("Deb0x: You do not have rewards");
        }
        let user3BalanceCycle2 = await dbxERC20.balanceOf(user3.address);
        console.log("Balanta user3 ciclul 2:")
        console.log(user3BalanceCycle2)
            // expect(user3BalanceCycle2).to.equal(0);

        try {
            await user2Reward.claimRewards();
        } catch (error) {
            expect(error.message).to.include("Deb0x: You do not have rewards");
        }
        let user2BalanceCycle2 = await dbxERC20.balanceOf(user2.address);
        // expect(user2BalanceCycle2).to.equal(0);

        await frontend.claimFrontEndRewards();
        let frontBalanceCycle2 = await dbxERC20.balanceOf(feeReceiver.address);
        // expect(BigNumber.from(secondDayReward).add(BigNumber.from(firstDayReward))).to.equal(frontBalanceCycle2);

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 10000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

    });
})