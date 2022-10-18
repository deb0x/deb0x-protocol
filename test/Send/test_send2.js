const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const { abiDBXCore } = require("../../artifacts/contracts/Deb0xCore.sol/Deb0xCore.json")

describe("Test send messages and fetch functions", async function() {
    let rewardedAlice, rewardedBob, rewardedCarol, frontend, dbxERC20;
    let alice, bob;
    beforeEach("Set enviroment", async() => {
        [alice, bob, carol, messageReceiver, feeReceiver] = await ethers.getSigners();

        const Deb0x = await ethers.getContractFactory("Deb0x");
        rewardedAlice = await Deb0x.deploy(ethers.constants.AddressZero);
        await rewardedAlice.deployed();

        const dbxAddress = await rewardedAlice.dbx()
        dbxERC20 = new ethers.Contract(dbxAddress, abi, hre.ethers.provider)

        // dbxCore = new ethers.Contract(dbx) 

        rewardedBob = rewardedAlice.connect(bob)
        rewardedCarol = rewardedAlice.connect(carol)
        frontend = rewardedAlice.connect(feeReceiver)
    });

    it("should test sending some messages ", async() => {

        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 200, 0, { value: ethers.utils.parseEther("2") })

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })

        await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let messagesAlice = await rewardedAlice.fetchSentMessages(alice.address);
        expect(messagesAlice.length).to.eq(2);
    })


    it("should test sending some messages  in different cycles", async() => {

        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 200, 0, { value: ethers.utils.parseEther("2") })

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })

        await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })


        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 200, 0, { value: ethers.utils.parseEther("2") })

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")


        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })

        let messagesAlice = await rewardedAlice.fetchSentMessages(alice.address);
        expect(messagesAlice.length).to.eq(5);
    })

    it("should test sending some messages with feeReceiver = 0x00 address ", async() => {

        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            "0x0000000000000000000000000000000000000000", 200, 0, { value: ethers.utils.parseEther("2") })

        await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let messagesAlice = await rewardedAlice.fetchSentMessages(alice.address);
        expect(messagesAlice.length).to.eq(1);
    })

    it("should test sending some messages and msgFee + nativeTokenFee have different combinations", async() => {

        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 0, 0, { value: ethers.utils.parseEther("2") })

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 110, { value: ethers.utils.parseEther("2") })

        await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 0, 100, { value: ethers.utils.parseEther("2") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let messagesAlice = await rewardedAlice.fetchSentMessages(alice.address);
        expect(messagesAlice.length).to.eq(2);
    })

    it("should test sending some messages but we don't send enaugh eth", async() => {

        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 200, 0, ).then(res => {
            assert.fail("must throw err");
        }).catch(err => {
            expect(err.message).to.contain("Deb0x: must pay 10% of transaction cost")
        })

        let messagesAlice = await rewardedAlice.fetchSentMessages(alice.address);
        expect(messagesAlice.length).to.eq(0);
    })

    it("should test sending some messages but we don't send enaugh eth V2", async() => {

        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 200, 0, { value: 20 }).then(res => {
            assert.fail("must throw err");
        }).catch(err => {
            expect(err.message).to.contain("Deb0x: must pay 10% of transaction cost")
        })

        let messagesAlice = await rewardedAlice.fetchSentMessages(alice.address);
        expect(messagesAlice.length).to.eq(0);
    })
});