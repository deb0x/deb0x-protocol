const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const { NumUtils } = require("../utils/NumUtils.ts");

describe("Test send functionality", async function() {
    let deb0xContract, user1Reward, user2Reward, user3Reward, frontend, dbxERC20;
    let user1, user2;
    beforeEach("Set enviroment", async() => {
        [user1, user2, user3, messageReceiver, feeReceiver] = await ethers.getSigners();

        const Deb0x = await ethers.getContractFactory("Deb0x");
        deb0xContract = await Deb0x.deploy();
        await deb0xContract.deployed();

        const dbxAddress = await deb0xContract.dbx()
        dbxERC20 = new ethers.Contract(dbxAddress, abi, hre.ethers.provider)

        user1Reward = deb0xContract.connect(user1)
        user2Reward = deb0xContract.connect(user2)
        user3Reward = deb0xContract.connect(user3)
        frontend = deb0xContract.connect(feeReceiver)
    })

    it("Check send message and reward distributed", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let rewardForFirstCycle = NumUtils.day(1);

        await user1Reward.claimRewards()
        let user1Balance = await dbxERC20.balanceOf(user1.address);
        expect(user1Balance).to.equal(rewardForFirstCycle.div(6));

        await user2Reward.claimRewards()
        let user2Balance = await dbxERC20.balanceOf(user2.address);
        expect(user2Balance).to.equal("33333333333333333333");

        await user3Reward.claimRewards()
        let user3Balance = await dbxERC20.balanceOf(user3.address);
        expect(user3Balance).to.equal(rewardForFirstCycle.div(2));

        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let rewardForSecondCycle = NumUtils.day(2);
        await user3Reward.claimRewards()
        let user3BalanceScondCycle = await dbxERC20.balanceOf(user3.address);
        expect(user3BalanceScondCycle).to.equal(rewardForSecondCycle.add(user3Balance));

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let rewardForThirdCycle = NumUtils.day(3);
        await user3Reward.claimRewards()
        let user3BalanceThirdCycle = await dbxERC20.balanceOf(user3.address);
        expect(user3BalanceThirdCycle).to.equal(user3BalanceScondCycle.add(rewardForThirdCycle.div(3)));

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 99])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 8])
        await hre.ethers.provider.send("evm_mine")

        //In 102 cycle user will recieve reward from cycle 4 
        let rewardForHundredTenCycle = NumUtils.day(4);
        await user3Reward.claimRewards()
        let user3BalanceHundredTenCycle = await dbxERC20.balanceOf(user3.address);
        expect(user3BalanceHundredTenCycle).to.equal(rewardForHundredTenCycle.add(user3BalanceThirdCycle));

    });

});

describe("Test send functionality from Deb0xCore contract!", async function() {
    beforeEach("Set enviroment", async() => {
        [deployer, add1, add2, add3, add4, add5, add6, add7] = await ethers.getSigners();

        const Deb0xCore = await ethers.getContractFactory("Deb0xCore");
        deboxCore = await Deb0xCore.deploy();
        await deboxCore.deployed();
    });

    it(`Test send function`, async() => {
        let addresses = [add1.address, add2.address, add2.address];
        let cids = ["ipfs1", "ipfs2", "ipfs2"];
        let transaction = await deboxCore.send(addresses, cids)
        let receipt = await transaction.wait();

        for (let i = 0; i < receipt.events.length - 1; i++) {
            expect(receipt.events[i].args.body.content).to.equal(cids[i]);
        }

    });

    it(`Test send function with multimple messages`, async() => {
        let addresses = [add1.address, add2.address, add3.address, add4.address, add5.address, add5.address, add5.address, add5.address];
        let cids = ["ipfs1", "ipfs2", "ipfs4", "ipfs4", "ipfs5", "ipfs5", "ipfs5", "ipfs5"];
        await deboxCore.send(addresses, cids)

        let transaction = await deboxCore.send(addresses, cids)
        let receipt = await transaction.wait();

        for (let i = 0; i < receipt.events.length - 1; i++) {
            expect(receipt.events[i].args.body.content).to.equal(cids[i]);
        }

    });

    it(`Test fetch messages in case of multimple messages`, async() => {
        let addresses = [add1.address, add2.address, add3.address, add3.address];
        let cids = ["ipfs1", "ipfs2", "ipfs4", "ipfs4"];
        let transaction = await deboxCore.send(addresses, cids)
        let receipt = await transaction.wait();

        for (let i = 0; i < receipt.events.length - 1; i++) {
            expect(deployer.address).to.equal(receipt.events[i].args.from);
        }

        let addresses2 = [add1.address, add2.address, add3.address, add3.address];
        let cids2 = ["ipfs1", "ipfs2", "ipfs4", "ipfs4"];

        let transactionAddress1 = await deboxCore.connect(add1).send(addresses2, cids2)
        let receiptAddress1 = await transactionAddress1.wait();

        for (let i = 0; i < receiptAddress1.events.length - 1; i++) {
            expect(add1.address).to.equal(receiptAddress1.events[i].args.from);
        }

        let addresses3 = [add1.address, add2.address, add3.address, add3.address];
        let cids3 = ["ipfs1", "ipfs2", "ipfs4", "ipfs4"];

        let transactionAddress2 = await deboxCore.connect(add2).send(addresses3, cids3)
        let receiptAddress2 = await transactionAddress2.wait();

        for (let i = 0; i < receiptAddress2.events.length - 1; i++) {
            expect(add2.address).to.equal(receiptAddress2.events[i].args.from);
        }
    });

    it(`Test inbox and outbox`, async() => {
        let addresses = [add1.address, add2.address, add3.address, add4.address, add5.address, add6.address, add1.address];
        let cids = ["ipfs1", "ipfs2", "ipfs3", "ipfs4", "ipfs5", "ipfs6", "ipfs1"];

        let transaction = await deboxCore.connect(add1).send(addresses, cids);
        let receipt = await transaction.wait();
        expect(add1.address).to.equal(receipt.events[0].args.from);

        for (let i = 0; i < receipt.events.length - 1; i++) {
            expect(receipt.events[i].args.body.content).to.equal(cids[i]);
        }

        let filter = receipt.events.filter(event => event.args.from === add1.address);
        for (let i = 0; i < filter.length - 1; i++) {
            expect(filter[i].args.to).to.equal(addresses[i]);
        }
        for (let i = 0; i < filter.length - 1; i++) {
            expect(filter[i].args.body.content).to.equal(cids[i]);
        }

        let addressesUser2Sent = [add2.address, add3.address, add4.address, add5.address, add6.address, add6.address, add2.address];
        let cidsUser2Sent = ["msg2", "msg3", "msg4", "msg5", "msg6", "msg6", "msg2"];

        let transaction2 = await deboxCore.connect(add2).send(addressesUser2Sent, cidsUser2Sent);
        let receipt2 = await transaction2.wait();
        expect(add2.address).to.equal(receipt2.events[0].args.from);

        let filter2 = receipt2.events.filter(event => event.args.from === add2.address);
        for (let i = 0; i < filter2.length - 1; i++) {
            expect(filter2[i].args.to).to.equal(addressesUser2Sent[i]);
        }
        for (let i = 0; i < filter2.length - 1; i++) {
            expect(filter2[i].args.body.content).to.equal(cidsUser2Sent[i]);
        }
    });



})