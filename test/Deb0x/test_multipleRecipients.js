const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { ContractFunctionVisibility } = require("hardhat/internal/hardhat-network/stack-traces/model");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const { NumUtils } = require("../utils/NumUtils.ts");

describe("Test reward distribution for multiple recipients", async function() {
    let userReward, user1Reward, user2Reward, user3Reward, user4Reward, frontend, dbxERC20;
    let user1, user2;
    beforeEach("Set enviroment", async() => {
        [user1, user2, user3, user4, user5, user6, user7, user8, user9, user10, messageReceiver, feeReceiver] = await ethers.getSigners();

        const Deb0x = await ethers.getContractFactory("Deb0x");
        userReward = await Deb0x.deploy(ethers.constants.AddressZero);
        await userReward.deployed();

        const dbxAddress = await userReward.dbx()
        dbxERC20 = new ethers.Contract(dbxAddress, abi, hre.ethers.provider)

        user1Reward = userReward.connect(user1)
        user2Reward = userReward.connect(user2)
        user3Reward = userReward.connect(user3)
        user4Reward = userReward.connect(user4)
        frontend = userReward.connect(feeReceiver)
    })

    it(`Test multiple recipients simple case`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user2.address, user3.address], ["ipfs://", "ipfs://", "ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let firstCycleRewardPerUser = NumUtils.day(1).div(4);
        await user1Reward.claimRewards();
        let balanceForUser1 = await dbxERC20.balanceOf(user1.address);
        expect(BigNumber.from(firstCycleRewardPerUser).mul(BigNumber.from(3))).to.equal(balanceForUser1)

        await user2Reward.claimRewards();
        let balanceForUser2 = await dbxERC20.balanceOf(user2.address);
        expect(firstCycleRewardPerUser).to.equal(balanceForUser2)
    });

    it(`Test multiple recipients, multiple cycles`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user2.address], ["ipfs://", "ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let firstCycleRewardPerUser = NumUtils.day(1).div(3);
        await user1Reward.claimRewards();
        let balanceForUser1 = await dbxERC20.balanceOf(user1.address);
        expect(BigNumber.from(firstCycleRewardPerUser).mul(BigNumber.from(2))).to.equal(balanceForUser1)

        await user2Reward.claimRewards();
        let balanceForUser2 = await dbxERC20.balanceOf(user2.address);
        expect(firstCycleRewardPerUser).to.equal(balanceForUser2)

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user2.address], ["ipfs://", "ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let secondCycleRewardPerUser = NumUtils.day(2).div(3);
        await user1Reward.claimRewards();
        let balanceForUser1Cycle2 = await dbxERC20.balanceOf(user1.address);
        expect(BigNumber.from(secondCycleRewardPerUser).mul(BigNumber.from(2))).to.equal(BigNumber.from(balanceForUser1Cycle2.sub(BigNumber.from(balanceForUser1))))

        await user2Reward.claimRewards();
        let balanceForUser2Cycle2 = await dbxERC20.balanceOf(user2.address);
        expect(secondCycleRewardPerUser).to.equal(BigNumber.from(balanceForUser2Cycle2.sub(BigNumber.from(balanceForUser2))))

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user2.address], ["ipfs://", "ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let thirdCycleRewardPerUser = NumUtils.day(3).div(3);
        await user1Reward.claimRewards();
        let balanceForUser1Cycle3 = await dbxERC20.balanceOf(user1.address);
        expect(BigNumber.from(thirdCycleRewardPerUser).mul(BigNumber.from(2))).to.equal(BigNumber.from(balanceForUser1Cycle3.sub(BigNumber.from(balanceForUser1Cycle2))))

        await user2Reward.claimRewards();
        let balanceForUser2Cycle3 = await dbxERC20.balanceOf(user2.address);
        expect(thirdCycleRewardPerUser).to.equal(BigNumber.from(balanceForUser2Cycle3.sub(BigNumber.from(balanceForUser2Cycle2))))

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user2.address], ["ipfs://", "ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user1.address], ["ipfs://", "ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        // 1 wei difference 
        let fourthCycleRewardPerUser = NumUtils.day(4).div(5);
        await user1Reward.claimRewards();
        let balanceForUser1Cycle4 = await dbxERC20.balanceOf(user1.address);
        // expect(BigNumber.from(fourthCycleRewardPerUser).mul(BigNumber.from(2))).to.equal(BigNumber.from(balanceForUser1Cycle4.sub(BigNumber.from(balanceForUser1Cycle3))))

        await user2Reward.claimRewards();
        let balanceForUser2Cycle4 = await dbxERC20.balanceOf(user2.address);
        expect(fourthCycleRewardPerUser).to.equal(BigNumber.from(balanceForUser2Cycle4.sub(BigNumber.from(balanceForUser2Cycle3))))

        // 1 wei difference 
        await user3Reward.claimRewards();
        let balanceForUser3Cycle4 = await dbxERC20.balanceOf(user3.address);
        // expect(BigNumber.from(fourthCycleRewardPerUser).mul(BigNumber.from(2))).to.equal(balanceForUser3Cycle4);

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user2.address, user1.address], ["ipfs://", "ipfs://", "ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user1.address, user2.address], ["ipfs://", "ipfs://", "ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user1.address], ["ipfs://", "ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        // 1 wei difference 
        let fifthCycleRewardPerUser = NumUtils.day(5).div(8);
        await user1Reward.claimRewards();
        let balanceForUser1Cycle5 = await dbxERC20.balanceOf(user1.address);
        //   expect(BigNumber.from(fifthCycleRewardPerUser).mul(BigNumber.from(3))).to.equal(BigNumber.from(balanceForUser1Cycle5.sub(BigNumber.from(balanceForUser1Cycle4))))

        // 1 wei difference 
        await user2Reward.claimRewards();
        let balanceForUser2Cycle5 = await dbxERC20.balanceOf(user2.address);
        // expect(fifthCycleRewardPerUser.mul(BigNumber.from(3))).to.equal(BigNumber.from(balanceForUser2Cycle5.sub(BigNumber.from(balanceForUser2Cycle4))))

        await user3Reward.claimRewards();
        let balanceForUser3Cycle5 = await dbxERC20.balanceOf(user3.address);
        expect(BigNumber.from(fifthCycleRewardPerUser).mul(BigNumber.from(2))).to.equal(BigNumber.from(balanceForUser3Cycle5).sub(BigNumber.from(balanceForUser3Cycle4)));
    });

    it(`Test multiple recipients simple case`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user2.address, user3.address, user4.address, user5.address, user6.address, user7.address, user8.address, user9.address, user10.address], ["ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let firstCycleRewardPerUser = NumUtils.day(1).div(11);
        await user1Reward.claimRewards();
        let balanceForUser1 = await dbxERC20.balanceOf(user1.address);
        expect(BigNumber.from(firstCycleRewardPerUser).mul(BigNumber.from(10))).to.equal(balanceForUser1)

        await user2Reward.claimRewards();
        let balanceForUser2 = await dbxERC20.balanceOf(user2.address);
        expect(firstCycleRewardPerUser).to.equal(balanceForUser2)

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user2.address, user3.address, user4.address, user5.address, user6.address, user7.address, user8.address, user9.address, user10.address], ["ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user1.address, user2.address, user4.address, user5.address, user6.address, user7.address, user8.address, user9.address, user10.address], ["ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //3 wei difference
        let secondCycleRewardPerUser = NumUtils.day(2).div(21);
        await user1Reward.claimRewards();
        let balanceForUser1Cycle2 = await dbxERC20.balanceOf(user1.address);
        // expect(BigNumber.from(secondCycleRewardPerUser).mul(BigNumber.from(10))).to.equal(BigNumber.from(balanceForUser1Cycle2).sub(BigNumber.from(balanceForUser1)));

        await user2Reward.claimRewards();
        let balanceForUser2Cycle2 = await dbxERC20.balanceOf(user2.address);
        expect(BigNumber.from(secondCycleRewardPerUser)).to.equal(BigNumber.from(balanceForUser2Cycle2).sub(BigNumber.from(balanceForUser2)));

        //3 wei difference
        await user3Reward.claimRewards();
        let balanceForUser3Cycle2 = await dbxERC20.balanceOf(user3.address);
        // expect(BigNumber.from(secondCycleRewardPerUser).mul(BigNumber.from(10))).to.equal(balanceForUser3Cycle2);

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user3.address, user4.address, user5.address, user6.address, user7.address, user8.address, user9.address, user10.address], ["ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address, user2.address, user4.address, user5.address, user6.address, user7.address, user8.address, user9.address, user10.address], ["ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user4Reward["send(address[],string[],address,uint256,uint256)"]([user1.address, user2.address, user7.address, user8.address], ["ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs://", "ipfs"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //6 wei difference
        let thirdCycleRewardPerUser = NumUtils.day(3).div(23);
        await user1Reward.claimRewards();
        let balanceForUser1Cycle3 = await dbxERC20.balanceOf(user1.address);
        //expect(BigNumber.from(thirdCycleRewardPerUser).mul(BigNumber.from(9))).to.equal(BigNumber.from(balanceForUser1Cycle3).sub(BigNumber.from(balanceForUser1Cycle2)));

        await user2Reward.claimRewards();
        let balanceForUser2Cycle3 = await dbxERC20.balanceOf(user2.address);
        expect(BigNumber.from(thirdCycleRewardPerUser)).to.equal(BigNumber.from(balanceForUser2Cycle3).sub(BigNumber.from(balanceForUser2Cycle2)));

        //6 wei difference
        await user3Reward.claimRewards();
        let balanceForUser3Cycle3 = await dbxERC20.balanceOf(user3.address);
        //expect(BigNumber.from(thirdCycleRewardPerUser).mul(BigNumber.from(9))).to.equal(BigNumber.from(balanceForUser3Cycle3).sub(BigNumber.from(balanceForUser3Cycle2)));

        //2 wei difference
        await user4Reward.claimRewards();
        let balanceForUser4Cycle3 = await dbxERC20.balanceOf(user4.address);
        // expect(BigNumber.from(thirdCycleRewardPerUser).mul(BigNumber.from(4))).to.equal(balanceForUser4Cycle3);
    });


})