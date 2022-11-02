const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
// const { abiDBXCore } = require("../../artifacts/contracts/Deb0xCore.sol/Deb0xCore.json")

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

        rewardedBob = rewardedAlice.connect(bob)
        rewardedCarol = rewardedAlice.connect(carol)
        frontend = rewardedAlice.connect(feeReceiver)
    });

    it("should test sending some messages ", async() => {

        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        let sendFirstMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 200, 0, { value: ethers.utils.parseEther("2") })
        let receiptFirstMessage = await sendFirstMessage.wait();

        let sendSecondMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })
        let receiptSecondMessage = await sendSecondMessage.wait();

        let sendThirdMessage = await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })
        let receiptThirdMessage = await sendThirdMessage.wait();

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let totalNumberOfMessagesSentByAlice = 0;
        for (let i = 0; i < receiptFirstMessage.events.length - 1; i++) {
            if (receiptFirstMessage.events[i].event === 'Sent' && receiptFirstMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }
        for (let i = 0; i < receiptSecondMessage.events.length - 1; i++) {
            if (receiptSecondMessage.events[i].event === 'Sent' && receiptSecondMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }
        for (let i = 0; i < receiptThirdMessage.events.length - 1; i++) {
            if (receiptThirdMessage.events[i].event === 'Sent' && receiptThirdMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }

        expect(totalNumberOfMessagesSentByAlice).to.eq(2);
    })

    it("should test sending some messages  in different cycles", async() => {

        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        let sendFirstMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 200, 0, { value: ethers.utils.parseEther("2") })
        let receiptFirstMessage = await sendFirstMessage.wait();

        let sendSecondMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })
        let receiptSecondMessage = await sendSecondMessage.wait();

        let sendThirdMessage = await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })
        let receiptThirdMessage = await sendThirdMessage.wait();

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let sendFourthMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 200, 0, { value: ethers.utils.parseEther("2") })
        let receiptForthMessage = await sendFourthMessage.wait();

        let sendFifthMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })
        let receiptFifthMessage = await sendFifthMessage.wait();

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let sendSixthMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })
        let receiptSixthMessage = await sendSixthMessage.wait();

        let totalNumberOfMessagesSentByAlice = 0;
        for (let i = 0; i < receiptFirstMessage.events.length - 1; i++) {
            if (receiptFirstMessage.events[i].event === 'Sent' && receiptFirstMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }
        for (let i = 0; i < receiptSecondMessage.events.length - 1; i++) {
            if (receiptSecondMessage.events[i].event === 'Sent' && receiptSecondMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }
        for (let i = 0; i < receiptThirdMessage.events.length - 1; i++) {
            if (receiptThirdMessage.events[i].event === 'Sent' && receiptThirdMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }
        for (let i = 0; i < receiptForthMessage.events.length - 1; i++) {
            if (receiptForthMessage.events[i].event === 'Sent' && receiptForthMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }
        for (let i = 0; i < receiptFifthMessage.events.length - 1; i++) {
            if (receiptFifthMessage.events[i].event === 'Sent' && receiptFifthMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }
        for (let i = 0; i < receiptSixthMessage.events.length - 1; i++) {
            if (receiptSixthMessage.events[i].event === 'Sent' && receiptSixthMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }

        expect(totalNumberOfMessagesSentByAlice).to.eq(5);
    })

    it("should test sending some messages with feeReceiver = 0x00 address ", async() => {

        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        let sendFirstMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            "0x0000000000000000000000000000000000000000", 200, 0, { value: ethers.utils.parseEther("2") })
        let receiptFirstMessage = await sendFirstMessage.wait();

        let sendSecondMessage = await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("2") })
        let receiptSecondMessage = await sendSecondMessage.wait();

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let totalNumberOfMessagesSentByAlice = 0;
        for (let i = 0; i < receiptFirstMessage.events.length - 1; i++) {
            if (receiptFirstMessage.events[i].event === 'Sent' && receiptFirstMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }
        for (let i = 0; i < receiptSecondMessage.events.length - 1; i++) {
            if (receiptSecondMessage.events[i].event === 'Sent' && receiptSecondMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }

        expect(totalNumberOfMessagesSentByAlice).to.eq(1);
    })

    it("should test sending some messages and msgFee + nativeTokenFee have different combinations", async() => {

        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        let sendFirstMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 0, 0, { value: ethers.utils.parseEther("2") })
        let receiptFirstMessage = await sendFirstMessage.wait();

        let sendSecondMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 100, 110, { value: ethers.utils.parseEther("2") })
        let receiptSecondMessage = await sendSecondMessage.wait();

        let sendThirdMessage = await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 0, 100, { value: ethers.utils.parseEther("2") })
        let receiptThirdMessage = await sendThirdMessage.wait();

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let totalNumberOfMessagesSentByAlice = 0;
        for (let i = 0; i < receiptFirstMessage.events.length - 1; i++) {
            if (receiptFirstMessage.events[i].event === 'Sent' && receiptFirstMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }
        for (let i = 0; i < receiptSecondMessage.events.length - 1; i++) {
            if (receiptSecondMessage.events[i].event === 'Sent' && receiptSecondMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }
        for (let i = 0; i < receiptThirdMessage.events.length - 1; i++) {
            if (receiptThirdMessage.events[i].event === 'Sent' && receiptThirdMessage.events[i].args.from === alice.address) {
                totalNumberOfMessagesSentByAlice++;
            }
        }

        expect(totalNumberOfMessagesSentByAlice).to.eq(2);
    })

    it("should test sending some messages but we don't send enaugh eth", async() => {
        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        let sendMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 200, 0, ).then(res => {
            assert.fail("must throw err");
        }).catch(err => {
            expect(err.message).to.contain("Deb0x: value must be >= 10% of the spent gas")
        })
        let totalNumberOfMessagesSentByAlice = 0;
        if (sendMessage != undefined) {
            let receiptFirstMessage = await sendMessage.wait();
            for (let i = 0; i < receiptFirstMessage.events.length - 1; i++) {
                if (receiptFirstMessage.events[i].event === 'Sent' && receiptFirstMessage.events[i].args.from === alice.address) {
                    totalNumberOfMessagesSentByAlice++;
                }
            }
        }
        expect(totalNumberOfMessagesSentByAlice).to.eq(0);
    })

    it("should test sending some messages but we don't send enaugh eth V2", async() => {

        aliceBalance = await hre.ethers.provider.getBalance(alice.address)
        let curCycle = parseInt((await rewardedAlice.getCurrentCycle()).toString())

        let sendMessage = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 200, 0, { value: 20 }).then(res => {
            assert.fail("must throw err");
        }).catch(err => {
            expect(err.message).to.contain("Deb0x: value must be >= 10% of the spent gas")
        })
        let totalNumberOfMessagesSentByAlice = 0;
        if (sendMessage != undefined) {
            let receiptFirstMessage = await sendMessage.wait();
            for (let i = 0; i < receiptFirstMessage.events.length - 1; i++) {
                if (receiptFirstMessage.events[i].event === 'Sent' && receiptFirstMessage.events[i].args.from === alice.address) {
                    totalNumberOfMessagesSentByAlice++;
                }
            }
        }
        expect(totalNumberOfMessagesSentByAlice).to.eq(0);
    })
});