const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { ContractFunctionVisibility } = require("hardhat/internal/hardhat-network/stack-traces/model");
const { abi:Deb0xAbi } = require("../../artifacts/contracts/Deb0x.sol/Deb0x.json")
const { Converter } = require("../utils/Converter.ts");
let ipfsLink = "QmWfmAHFy6hgr9BPmh2DX31qhAs4bYoteDDwK51eyG9En9";
let payload = Converter.convertStringToBytes32(ipfsLink);
let DEBOX_ADDRESS = "0x3A274DD833726D9CfDb6cBc23534B2cF5e892347";

describe("Test DBX tokens distributions", async function() {
    let deb0x, deb0xViews
    beforeEach("Set enviroment", async() => {
        [user1, user2, user3, messageReceiver, feeReceiver] = await ethers.getSigners();

        deb0x = new ethers.Contract(DEBOX_ADDRESS, Deb0xAbi, hre.ethers.provider)
        //deb0xViews = new ethers.Contract(DEBOXVIEW_ADDRESS, Deb0xViewsAbi, hre.ethers.provider)

        const Deb0xViews = await ethers.getContractFactory("Deb0xViews");
        deb0xViews = await Deb0xViews.deploy(DEBOX_ADDRESS);
        await deb0xViews.deployed();

    })

    it.only("Test mainnet", async function() {
        console.log(await deb0xViews.getUnclaimedFees("0x845a1a2e29095c469e755456aa49b09d366f0beb"))
        console.log(await deb0x.getCurrentCycle())
        console.log(await deb0x.currentCycle())

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        // const address = "0x845a1a2e29095c469e755456aa49b09d366f0beb";
        // await helpers.impersonateAccount(address);
        const impersonatedSigner = await ethers.getImpersonatedSigner("0x845a1a2e29095c469e755456aa49b09d366f0beb");

        let deb0xImpersonatedSigner = deb0x.connect(impersonatedSigner)
        deb0xImpersonatedSigner["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("0.1") })
        //console.log(await deb0xImpersonatedSigner.currentCycle())
    })
})