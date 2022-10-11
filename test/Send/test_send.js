const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const { NumUtils } = require("../utils/NumUtils.ts");

describe("Test unstake functionality", async function() {
    let deb0xContract, user1Reward, user2Reward, user3Reward, frontend, dbxERC20;
    let user1, user2;
    beforeEach("Set enviroment", async() => {
        [user1, user2, user3, messageReceiver, feeReceiver] = await ethers.getSigners();

        const Deb0x = await ethers.getContractFactory("Deb0x");
        deb0xContract = await Deb0x.deploy(ethers.constants.AddressZero);
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
        deboxCore = await Deb0xCore.deploy(ethers.constants.AddressZero);
        await deboxCore.deployed();
    });

    it(`Test send function`, async() => {
        let addresses = [add1.address, add2.address, add2.address];
        let cids = ["ipfs1", "ipfs2", "ipfs2"];
        await deboxCore.send(addresses, cids)

        let messagesAdd1 = await deboxCore.fetchMessages(add1.address, deployer.address);
        expect(messagesAdd1[0].cid).to.equal(cids[0]);
        let messagesAdd2 = await deboxCore.fetchMessages(add2.address, deployer.address);
        expect(messagesAdd2[0].cid).to.equal(cids[1]);
    });

    it(`Test send function with multimple messages`, async() => {
        let addresses = [add1.address, add2.address, add3.address, add4.address, add5.address, add5.address, add5.address, add5.address];
        let cids = ["ipfs1", "ipfs2", "ipfs4", "ipfs4", "ipfs5", "ipfs5", "ipfs5", "ipfs5"];
        await deboxCore.send(addresses, cids)

        let messagesAdd1 = await deboxCore.fetchMessages(add1.address, deployer.address);
        expect(messagesAdd1[0].cid).to.equal(cids[0]);
        let messagesAdd2 = await deboxCore.fetchMessages(add2.address, deployer.address);
        expect(messagesAdd2[0].cid).to.equal(cids[1]);
        let messagesAdd3 = await deboxCore.fetchMessages(add3.address, deployer.address);
        expect(messagesAdd3[0].cid).to.equal(cids[2]);
        let messagesAdd4 = await deboxCore.fetchMessages(add4.address, deployer.address);
        expect(messagesAdd4[0].cid).to.equal(cids[3]);
        let messagesAdd5 = await deboxCore.fetchMessages(add5.address, deployer.address);
        expect(messagesAdd5[0].cid).to.equal(cids[4]);

    });

    it(`Test fetchMessageSenders function with multimple messages`, async() => {
        let addresses = [add1.address, add2.address, add3.address, add3.address];
        let cids = ["ipfs1", "ipfs2", "ipfs4", "ipfs4"];
        await deboxCore.send(addresses, cids)
        let addressSenderAdd1 = await deboxCore.fetchMessageSenders(add1.address);
        expect(addressSenderAdd1[0]).to.equal(deployer.address);
        let addressSenderAdd2 = await deboxCore.fetchMessageSenders(add2.address);
        expect(addressSenderAdd2[0]).to.equal(deployer.address);
        let addressSenderAdd3 = await deboxCore.fetchMessageSenders(add3.address);
        expect(addressSenderAdd3[0]).to.equal(deployer.address);

        let addresses2 = [add1.address, add2.address, add3.address, add3.address];
        let cids2 = ["ipfs1", "ipfs2", "ipfs4", "ipfs4"];

        await deboxCore.connect(add1).send(addresses2, cids2)
        let addressSenderAdd1SecoundStage = await deboxCore.fetchMessageSenders(add1.address);
        expect(addressSenderAdd1SecoundStage[1]).to.equal(add1.address);
        let addressSenderAdd2SecondStage = await deboxCore.fetchMessageSenders(add2.address);
        expect(addressSenderAdd2SecondStage[1]).to.equal(add1.address);
        let addressSenderAdd3SecondStage = await deboxCore.fetchMessageSenders(add3.address);
        expect(addressSenderAdd3SecondStage[1]).to.equal(add1.address);

        let addresses3 = [add1.address, add2.address, add3.address, add3.address];
        let cids3 = ["ipfs1", "ipfs2", "ipfs4", "ipfs4"];

        await deboxCore.connect(add2).send(addresses3, cids3)
        let addressSenderAdd1ThirdStage = await deboxCore.fetchMessageSenders(add1.address);
        expect(addressSenderAdd1ThirdStage[1]).to.equal(add1.address);
        let addressSenderAdd2ThirdStage = await deboxCore.fetchMessageSenders(add2.address);
        expect(addressSenderAdd2ThirdStage[1]).to.equal(add1.address);
        let addressSenderAdd3ThirdStage = await deboxCore.fetchMessageSenders(add3.address);
        expect(addressSenderAdd3ThirdStage[1]).to.equal(add1.address);
    });

    it(`Test inbox and outbox`, async() => {
        let addresses = [add1.address, add2.address, add3.address, add4.address, add5.address, add6.address, add1.address];
        let cids = ["ipfs1", "ipfs2", "ipfs3", "ipfs4", "ipfs5", "ipfs6", "ipfs1"];
        await deboxCore.connect(add1).send(addresses, cids);

        //Test fetchMessageSender
        let fetchMessagesSender = await deboxCore.fetchMessageSenders(add1.address);
        expect(fetchMessagesSender[0]).to.equal(add1.address);

        //Test fetchMessages
        let fetchMessagesUser1ToUser2 = await deboxCore.fetchMessages(add2.address, add1.address);
        expect(fetchMessagesUser1ToUser2[0].cid).to.equal(cids[1]);
        let fetchMessagesUser1ToUser3 = await deboxCore.fetchMessages(add3.address, add1.address);
        expect(fetchMessagesUser1ToUser3[0].cid).to.equal(cids[2]);
        let fetchMessagesUser1ToUser4 = await deboxCore.fetchMessages(add4.address, add1.address);
        expect(fetchMessagesUser1ToUser4[0].cid).to.equal(cids[3]);
        let fetchMessagesUser1ToUser5 = await deboxCore.fetchMessages(add5.address, add1.address);
        expect(fetchMessagesUser1ToUser5[0].cid).to.equal(cids[4]);
        let fetchMessagesUser1ToUser6 = await deboxCore.fetchMessages(add6.address, add1.address);
        expect(fetchMessagesUser1ToUser6[0].cid).to.equal(cids[5]);

        //Test fetchMessages
        let messageRecieveUser1 = await deboxCore.fetchSentMessages(add1.address);
        let fetchSentMessagesAddresses = messageRecieveUser1[0].recipients;
        for (let i = 0; i < fetchSentMessagesAddresses.length; i++) {
            expect(fetchSentMessagesAddresses[i]).to.equal(addresses[i]);
        }

        let addressesUser2Sent = [add2.address, add3.address, add4.address, add5.address, add6.address, add6.address, add2.address];
        let cidsUser2Sent = ["msg2", "msg3", "msg4", "msg5", "msg6", "msg6", "msg2"];
        await deboxCore.connect(add2).send(addressesUser2Sent, cidsUser2Sent);

        //Test fetchMessageSender
        let fetchMessagesSenderUser2 = await deboxCore.fetchMessageSenders(add2.address);
        expect(fetchMessagesSenderUser2[1]).to.equal(add2.address);

        //Test fetchMessages
        let fetchMessagesUser2ToUser2 = await deboxCore.fetchMessages(add2.address, add2.address);
        expect(fetchMessagesUser2ToUser2[0].cid).to.equal(cidsUser2Sent[0]);
        let fetchMessagesUser2ToUser3 = await deboxCore.fetchMessages(add3.address, add2.address);
        expect(fetchMessagesUser2ToUser3[0].cid).to.equal(cidsUser2Sent[1]);
        let fetchMessagesUser2ToUser4 = await deboxCore.fetchMessages(add4.address, add2.address);
        expect(fetchMessagesUser2ToUser4[0].cid).to.equal(cidsUser2Sent[2]);
        let fetchMessagesUser2ToUser5 = await deboxCore.fetchMessages(add5.address, add2.address);
        expect(fetchMessagesUser2ToUser5[0].cid).to.equal(cidsUser2Sent[3]);
        let fetchMessagesUser2ToUser6 = await deboxCore.fetchMessages(add6.address, add2.address);
        expect(fetchMessagesUser2ToUser6[0].cid).to.equal(cidsUser2Sent[4]);

        //Test fetchMessages
        let messageRecieveForUser2 = await deboxCore.fetchSentMessages(add2.address);
        let fetchSentMessagesAddressesUser2 = messageRecieveForUser2[0].recipients;
        for (let i = 0; i < fetchSentMessagesAddressesUser2.length; i++) {
            expect(fetchSentMessagesAddressesUser2[i]).to.equal(addressesUser2Sent[i]);
        }

    });



})