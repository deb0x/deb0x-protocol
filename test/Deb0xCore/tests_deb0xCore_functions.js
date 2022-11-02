const { ethers } = require("hardhat");
// const { abi } = require("../../artifacts/contracts/Deb0xCore.sol/Deb0xCore.json")
const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("Test Deb0xCore contract", async function() {
    beforeEach("Set enviroment", async() => {
        [deployer, add1, add2, add3, add4, add5] = await ethers.getSigners();

        const Deb0xCore = await ethers.getContractFactory("Deb0x");
        deboxCore = await Deb0xCore.deploy(ethers.constants.AddressZero);
        await deboxCore.deployed();

        const Deb0xViews = await ethers.getContractFactory("Deb0xViews");
        deb0xViews = await Deb0xViews.deploy(deboxCore.address);
        await deb0xViews.deployed();
    });

    it(`Test setKey function`, async() => {
        let message = "Test"
        let transaction = await deboxCore.setKey(message);
        let receipt = await transaction.wait();
        expect(deployer.address).to.equal(receipt.events[0].args.to)
        console.log("TO: " + receipt.events[0].args.to + " HASH: " + receipt.events[0].args.hash + " VALUE: " + receipt.events[0].args.value);
    });

    it(`Test getKey function`, async() => {
        let key = await deb0xViews.getKey(deployer.address);
        expect(key).to.not.equal(null)
    });

    it(`Test send function`, async() => {
        let addresses = [add1.address, add2.address, add2.address];
        let cids = ["ipfs1", "ipfs2", "ipfs2"];

        let transaction = await deboxCore.send(addresses, cids, ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        let receipt = await transaction.wait();

        for (let i = 0; i < receipt.events.length - 1; i++) {
            expect(receipt.events[i].args.body.content).to.equal(cids[i]);
        }

    });

    it(`Test send function with multimple messages`, async() => {
        let addresses = [add1.address, add2.address, add3.address, add4.address, add5.address, add5.address, add5.address, add5.address];
        let cids = ["ipfs1", "ipfs2", "ipfs4", "ipfs4", "ipfs5", "ipfs5", "ipfs5", "ipfs5"];

        let transaction = await deboxCore.send(addresses, cids, ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        let receipt = await transaction.wait();

        for (let i = 0; i < receipt.events.length - 1; i++) {
            expect(receipt.events[i].args.body.content).to.equal(cids[i]);
        }

    });

    it(`Test get message sender with multimple messages`, async() => {
        let addresses = [add1.address, add2.address, add3.address, add3.address];
        let cids = ["ipfs1", "ipfs2", "ipfs4", "ipfs4"];
        let transaction = await deboxCore.send(addresses, cids, ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        let receipt = await transaction.wait();

        for (let i = 0; i < receipt.events.length - 1; i++) {
            expect(deployer.address).to.equal(receipt.events[i].args.from);
        }

        let addresses2 = [add1.address, add2.address, add3.address, add3.address];
        let cids2 = ["ipfs1", "ipfs2", "ipfs4", "ipfs4"];

        let transactionAddress1 = await deboxCore.connect(add1).send(addresses2, cids2, ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        let receiptAddress1 = await transactionAddress1.wait();

        for (let i = 0; i < receiptAddress1.events.length - 1; i++) {
            expect(add1.address).to.equal(receiptAddress1.events[i].args.from);
        }

        let addresses3 = [add1.address, add2.address, add3.address, add3.address];
        let cids3 = ["ipfs1", "ipfs2", "ipfs4", "ipfs4"];

        let transactionAddress2 = await deboxCore.connect(add2).send(addresses3, cids3, ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        let receiptAddress2 = await transactionAddress2.wait();

        for (let i = 0; i < receiptAddress2.events.length - 1; i++) {
            expect(add2.address).to.equal(receiptAddress2.events[i].args.from);
        }
    });

})