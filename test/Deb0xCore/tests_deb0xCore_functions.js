const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xCore.sol/Deb0xCore.json")
const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("Test Deb0xCore contract", async function() {
    beforeEach("Set enviroment", async() => {
        [deployer, add1, add2, add3, add4, add5] = await ethers.getSigners();

        const Deb0xCore = await ethers.getContractFactory("Deb0xCore");
        deboxCore = await Deb0xCore.deploy();
        await deboxCore.deployed();
    });

    it(`Test setKey function`, async() => {
        let message = "Test"
        await deboxCore.setKey(message);
    });

    it(`Test getKey function`, async() => {
        let key = await deboxCore.getKey(deployer.address);
        expect(key).to.not.equal(null)
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

    it(`Test fetchSentMessages function with multimple messages`, async() => {
        let addresses = [add1.address, add2.address, add3.address, add3.address];
        let cids = ["ipfs1", "ipfs2", "ipfs3", "ipfs4"];
        await deboxCore.send(addresses, cids)
        let messagesSentFromDelpoyer = await deboxCore.fetchSentMessages(deployer.address);
    });
})