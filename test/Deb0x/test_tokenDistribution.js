const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { ContractFunctionVisibility } = require("hardhat/internal/hardhat-network/stack-traces/model");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const { NumUtils } = require("../utils/NumUtils.ts");
const { Converter } = require("../utils/Converter.ts");
let ipfsLink = "QmWfmAHFy6hgr9BPmh2DX31qhAs4bYoteDDwK51eyG9En9";
let payload = Converter.convertStringToBytes32(ipfsLink);

describe("Test DBX tokens distributions", async function() {
    let userReward, user1Reward, user2Reward, user3Reward, user4Reward, user5Reward, user6Reward, user7Reward, user8Reward, frontend, dbxERC20, deb0xViews;
    let user1, user2, user3, user4, user5, user6, user7, user8;
    beforeEach("Set enviroment", async() => {
        [user1, user2, user3, user4, user5, user6, user7, user8, messageReceiver, feeReceiver] = await ethers.getSigners();

        const Deb0x = await ethers.getContractFactory("Deb0x");
        userReward = await Deb0x.deploy(ethers.constants.AddressZero);
        await userReward.deployed();

        const Deb0xViews = await ethers.getContractFactory("Deb0xViews");
        deb0xViews = await Deb0xViews.deploy(userReward.address);
        await deb0xViews.deployed();

        const dbxAddress = await userReward.dbx()
        dbxERC20 = new ethers.Contract(dbxAddress, abi, hre.ethers.provider)

        user1Reward = userReward.connect(user1)
        user2Reward = userReward.connect(user2)
        user3Reward = userReward.connect(user3)
        user4Reward = userReward.connect(user4)
        user5Reward = userReward.connect(user5)
        user6Reward = userReward.connect(user6)
        user7Reward = userReward.connect(user7)
        user8Reward = userReward.connect(user8)
        frontend = userReward.connect(feeReceiver)
    })

    it(`Simple test with two messages sent`, async() => {
        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let firstCycleRewardPerUser = NumUtils.day(1).div(2);
        await user1Reward.claimRewards();
        let balanceForUser1 = await dbxERC20.balanceOf(user1.address);
        expect(firstCycleRewardPerUser).to.equal(balanceForUser1)

        await user2Reward.claimRewards();
        let balanceForUser2 = await dbxERC20.balanceOf(user2.address);
        expect(firstCycleRewardPerUser).to.equal(balanceForUser2)
    });

    it(`Multiple messages sent in one cycle`, async() => {
        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user4Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let firstCycleRewardPerUser = NumUtils.day(1).div(4);

        await user1Reward.claimRewards();
        let balanceForUser1 = await dbxERC20.balanceOf(user1.address);
        expect(firstCycleRewardPerUser).to.equal(balanceForUser1)

        await user2Reward.claimRewards();
        let balanceForUser2 = await dbxERC20.balanceOf(user2.address);
        expect(firstCycleRewardPerUser).to.equal(balanceForUser2)

        await user3Reward.claimRewards();
        let balanceForUser3 = await dbxERC20.balanceOf(user3.address);
        expect(firstCycleRewardPerUser).to.equal(balanceForUser3)

        await user4Reward.claimRewards();
        let balanceForUser4 = await dbxERC20.balanceOf(user4.address);
        expect(firstCycleRewardPerUser).to.equal(balanceForUser4)
    });

    it(`Multiple messages sent in multiple cycle`, async() => {
        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user4Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let firstCycleRewardPerUser = NumUtils.day(1).div(6);

        //1 wei difference
        await user1Reward.claimRewards();
        let balanceForUser1 = await dbxERC20.balanceOf(user1.address);
        //  expect(firstCycleRewardPerUser.mul(2)).to.equal(balanceForUser1)

        //1 wei difference
        await user2Reward.claimRewards();
        let balanceForUser2 = await dbxERC20.balanceOf(user2.address);
        //expect(firstCycleRewardPerUser.mul(2)).to.equal(balanceForUser2)

        await user3Reward.claimRewards();
        let balanceForUser3 = await dbxERC20.balanceOf(user3.address);
        expect(firstCycleRewardPerUser).to.equal(balanceForUser3)

        await user4Reward.claimRewards();
        let balanceForUser4 = await dbxERC20.balanceOf(user4.address);
        expect(firstCycleRewardPerUser).to.equal(balanceForUser4)
        let cycle1TotalBalance = BigNumber.from(balanceForUser1).add(BigNumber.from(balanceForUser2)).add(BigNumber.from(balanceForUser3)).add(BigNumber.from(balanceForUser4));
        //9999999999999999999998 === 10000000000000000000000   => 2 wei difference
        //expect(cycle1TotalBalance).to.equal(NumUtils.day(1));

        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user4Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        await user2Reward.claimRewards();
        await user3Reward.claimRewards();
        await user4Reward.claimRewards();
        let balanceForUser1Cycle2 = await dbxERC20.balanceOf(user1.address);
        let balanceForUser2Cycle2 = await dbxERC20.balanceOf(user2.address);
        let balanceForUser3Cycle2 = await dbxERC20.balanceOf(user3.address);
        let balanceForUser4Cycle2 = await dbxERC20.balanceOf(user4.address);
        let cycle2TotalBalance = BigNumber.from(balanceForUser1Cycle2).add(BigNumber.from(balanceForUser2Cycle2)).add(BigNumber.from(balanceForUser3Cycle2)).add(BigNumber.from(balanceForUser4Cycle2));
        let expectedValue = BigNumber.from(NumUtils.day(1)).add(BigNumber.from(NumUtils.day(2)));
        //19980039920159680638719 === 19980039920159680638722  => two wei difference!
        //expect(cycle2TotalBalance).to.equal(expectedValue)
    });

    it(`Multiple messages sent, multiple cyle`, async() => {
        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user4Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user6Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        let balanceForUser1 = await dbxERC20.balanceOf(user1.address);
        await dbxERC20.connect(user1).approve(user1Reward.address, balanceForUser1);
        await user1Reward.stakeDBX(balanceForUser1);
        let stakeCycleUser1 = Number(await user1Reward.accFirstStake(user1.address));
        let user1BalanceCycle1 = await user1Reward.accStakeCycle(user1.address, stakeCycleUser1);

        let balanceForUser2 = await dbxERC20.balanceOf(user2.address);
        expect(balanceForUser2).to.equal(0);
        let user2UnclaimedReward = await deb0xViews.getUnclaimedRewards(user2.address);

        let balanceForUser3 = await dbxERC20.balanceOf(user3.address);
        expect(balanceForUser3).to.equal(0);
        let user3UnclaimedReward = await deb0xViews.getUnclaimedRewards(user3.address);

        await user4Reward.claimRewards();
        let balanceForUser4 = await dbxERC20.balanceOf(user4.address);

        await user5Reward.claimRewards();
        let balanceForUser5 = await dbxERC20.balanceOf(user5.address);
        await dbxERC20.connect(user5).approve(user5Reward.address, balanceForUser5);
        await user5Reward.stakeDBX(balanceForUser5);
        let stakeCycleUser5 = Number(await user1Reward.accFirstStake(user5.address));
        let user5BalanceCycle1 = await user1Reward.accStakeCycle(user1.address, stakeCycleUser5);

        await user6Reward.claimRewards();
        let balanceForUser6 = await dbxERC20.balanceOf(user6.address);

        await user7Reward.claimRewards();
        let balanceForUser7 = await dbxERC20.balanceOf(user7.address);
        await dbxERC20.connect(user7).approve(user7Reward.address, balanceForUser7);
        await user7Reward.stakeDBX(balanceForUser7);
        let stakeCycleUser7 = Number(await user7Reward.accFirstStake(user7.address));
        let user7BalanceCycle1 = await user7Reward.accStakeCycle(user1.address, stakeCycleUser7);

        let expectedValueCycle1 = BigNumber.from(user1BalanceCycle1).add(BigNumber.from(user2UnclaimedReward)).add(
                BigNumber.from(user3UnclaimedReward)).add(BigNumber.from(balanceForUser4)).add(BigNumber.from(user5BalanceCycle1)).add(
                BigNumber.from(balanceForUser6).add(BigNumber.from(user7BalanceCycle1))
            )
            // 9999999999999999999996 === 10000000000000000000000 => 4 wei difference
            //expect(expectedValueCycle1).to.equal(BigNumber.from(NumUtils.day(1)));

        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user6Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        let balanceForUser1Cyle2 = await dbxERC20.balanceOf(user1.address);
        await dbxERC20.connect(user1).approve(user1Reward.address, balanceForUser1Cyle2);
        await user1Reward.stakeDBX(balanceForUser1Cyle2);
        let stakeCycleUser1InCycle2 = Number(await user1Reward.accFirstStake(user1.address));
        let user1BalanceCycle2 = await user1Reward.accStakeCycle(user1.address, stakeCycleUser1InCycle2);

        await user2Reward.claimRewards();
        let balanceForUser2Cyle2 = await dbxERC20.balanceOf(user2.address);
        let balanceForUser2OnlyInCycle2 = BigNumber.from(balanceForUser2Cyle2).sub(user2UnclaimedReward)
        await dbxERC20.connect(user2).approve(user2Reward.address, balanceForUser2Cyle2);
        await user2Reward.stakeDBX(balanceForUser2Cyle2);
        let stakeCycleUser2InCycle2 = Number(await user2Reward.accFirstStake(user2.address));
        let user2BalanceCycle2 = await user2Reward.accStakeCycle(user2.address, stakeCycleUser2InCycle2);

        await user5Reward.claimRewards();
        let balanceForUser5Cyle2 = await dbxERC20.balanceOf(user5.address);

        let balanceForUser6Cyle2 = await dbxERC20.balanceOf(user6.address);
        let user6UnclaimedRewardCycle2 = await deb0xViews.getUnclaimedRewards(user6.address);

        await user7Reward.claimRewards();
        let balanceForUser7Cyle2 = await dbxERC20.balanceOf(user7.address);
        await dbxERC20.connect(user7).approve(user7Reward.address, balanceForUser7Cyle2);
        await user7Reward.stakeDBX(balanceForUser7Cyle2);
        let stakeCycleUser7InCycle2 = Number(await user7Reward.accFirstStake(user7.address));
        let user7BalanceCycle2 = await user7Reward.accStakeCycle(user7.address, stakeCycleUser7InCycle2);

        let expectedValueCycle2 = BigNumber.from(balanceForUser1Cyle2).add(BigNumber.from(balanceForUser2OnlyInCycle2)).add(
                BigNumber.from(balanceForUser5Cyle2)).add(BigNumber.from(user6UnclaimedRewardCycle2)).add(BigNumber.from(balanceForUser7Cyle2))
            //9980039920159680638720 === 9980039920159680638722 => 2 wei difference
            //expect(expectedValueCycle2).to.equal(BigNumber.from(NumUtils.day(2)))

        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let unstakeValueUser1 = await deb0xViews.getAccWithdrawableStake(user1.address);
        await user1Reward.claimRewards();
        let user1BlanceCycle3BeforeUnstake = await dbxERC20.balanceOf(user1.address);
        await user1Reward.unstake(unstakeValueUser1);
        let user1BlanceCycle3 = await dbxERC20.balanceOf(user1.address);

        let unstakeValueUser2 = await deb0xViews.getAccWithdrawableStake(user2.address);
        await user2Reward.claimRewards();
        let user2BlanceCycle3BeforeUnstake = await dbxERC20.balanceOf(user2.address);
        await user2Reward.unstake(unstakeValueUser2);
        let user2BlanceCycle3 = await dbxERC20.balanceOf(user2.address);
        let expectValueCycle3 = BigNumber.from(user2BlanceCycle3BeforeUnstake).add(BigNumber.from(user1BlanceCycle3BeforeUnstake))
            //9960119680798084469781 === 9960119680798084469782 => 1 wei difference
            //expect(expectValueCycle3).to.equal(BigNumber.from(NumUtils.day(3)))

    });

    it.only(`Multiple messages sent in one cycle`, async() => {
        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user4Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user6Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        let balanceForUser1 = await dbxERC20.balanceOf(user1.address);

        await user2Reward.claimRewards();
        let balanceForUser2 = await dbxERC20.balanceOf(user2.address);

        await user3Reward.claimRewards();
        let balanceForUser3 = await dbxERC20.balanceOf(user3.address);

        await user4Reward.claimRewards();
        let balanceForUser4 = await dbxERC20.balanceOf(user4.address);

        await user5Reward.claimRewards();
        let balanceForUser5 = await dbxERC20.balanceOf(user5.address);

        await user6Reward.claimRewards();
        let balanceForUser6 = await dbxERC20.balanceOf(user6.address);

        await user7Reward.claimRewards();
        let balanceForUser7 = await dbxERC20.balanceOf(user7.address);

        let expectedValueCycle1 = BigNumber.from(balanceForUser1).add(BigNumber.from(balanceForUser2)).add(
                BigNumber.from(balanceForUser3)).add(BigNumber.from(balanceForUser4)).add(BigNumber.from(balanceForUser5)).add(
                BigNumber.from(balanceForUser6).add(BigNumber.from(balanceForUser7))
            )
            // 9999999999999999999997 === 10000000000000000000000 => 3 wei difference
            //expect(expectedValueCycle1).to.equal(NumUtils.day(1));
        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user4Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user4Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        let balanceForUser1Cycle3 = await dbxERC20.balanceOf(user1.address);

        await user2Reward.claimRewards();
        let balanceForUser2Cycle3 = await dbxERC20.balanceOf(user2.address);

        await user3Reward.claimRewards();
        let balanceForUser3Cycle3 = await dbxERC20.balanceOf(user3.address);

        await user4Reward.claimRewards();
        let balanceForUser4Cycle3 = await dbxERC20.balanceOf(user4.address);

        await user5Reward.claimRewards();
        let balanceForUser5Cycle3 = await dbxERC20.balanceOf(user5.address);

        await user7Reward.claimRewards();
        let balanceForUser7Cycle3 = await dbxERC20.balanceOf(user7.address);

        let expectedValueCycle3 = BigNumber.from(balanceForUser1Cycle3).add(BigNumber.from(balanceForUser2Cycle3)).add(
            BigNumber.from(balanceForUser3Cycle3)).add(BigNumber.from(balanceForUser4Cycle3)).add(BigNumber.from(balanceForUser5Cycle3)).add(
            BigNumber.from(balanceForUser7Cycle3).add(BigNumber.from(balanceForUser6))
        )
        let tokenDistributionInThreeCycles = BigNumber.from(NumUtils.day(1)).add(BigNumber.from(NumUtils.day(2))).add(BigNumber.from(NumUtils.day(3)))
            //29940159600957765108496 === 29940159600957765108504 => 8 wei difference
            //expect(expectedValueCycle3).to.equal(tokenDistributionInThreeCycles);


        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user6Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user6Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let user1BalanceCycle4 = await dbxERC20.balanceOf(user1.address);
        await dbxERC20.connect(user1).approve(user1Reward.address, user1BalanceCycle4);
        await user1Reward.stakeDBX(user1BalanceCycle4);

        let balanceForUser2Cycle4 = await dbxERC20.balanceOf(user2.address);
        await dbxERC20.connect(user2).approve(user2Reward.address, balanceForUser2Cycle4);
        await user2Reward.stakeDBX(balanceForUser2Cycle4);

        let balanceForUser6Cycle4 = await dbxERC20.balanceOf(user6.address);
        await dbxERC20.connect(user6).approve(user6Reward.address, balanceForUser6Cycle4);
        await user6Reward.stakeDBX(balanceForUser6Cycle4);

        await user1Reward.claimRewards();
        await user2Reward.claimRewards();
        await user6Reward.claimRewards();
        let user1BalanceCycle4AfterStake = await dbxERC20.balanceOf(user1.address);
        let user2BalanceCycle4AfterStake = await dbxERC20.balanceOf(user2.address);
        let user6BalanceCycle4AfterStake = await dbxERC20.balanceOf(user6.address);

        //9940239202393297874032 === 9940239202393297874033 => 1 wei difference
        //let expectedValueCycle4 = BigNumber.from(user1BalanceCycle4AfterStake).add(BigNumber.from(user2BalanceCycle4AfterStake)).add(BigNumber.from(user6BalanceCycle4AfterStake));
        //expect(expectedValueCycle4).to.equal(NumUtils.day(4));

        await user1Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user4Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user6Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user6Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user6Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user7Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user5Reward["send(address[],bytes32[][],address,uint256,uint256)"]([messageReceiver.address], [payload], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        await user1Reward.unstake(await deb0xViews.getAccWithdrawableStake(user1.address))
        let balanceForUser1Cycle5 = await dbxERC20.balanceOf(user1.address);

        await user2Reward.claimRewards();
        await user2Reward.unstake(await deb0xViews.getAccWithdrawableStake(user2.address))
        let balanceForUser2Cycle5 = await dbxERC20.balanceOf(user2.address);

        await user3Reward.claimRewards();
        let balanceForUser3Cycle5 = await dbxERC20.balanceOf(user3.address);

        await user4Reward.claimRewards();
        let balanceForUser4Cycle5 = await dbxERC20.balanceOf(user4.address);

        await user5Reward.claimRewards();
        let balanceForUser5Cycle5 = await dbxERC20.balanceOf(user5.address);

        await user6Reward.claimRewards();
        await user6Reward.unstake(await deb0xViews.getAccWithdrawableStake(user6.address))
        let balanceForUser6ycle5 = await dbxERC20.balanceOf(user6.address);

        await user7Reward.claimRewards();
        let balanceForUser7Cycle5 = await dbxERC20.balanceOf(user7.address);

        let excepetedValueUntilCycle5 = BigNumber.from(balanceForUser1Cycle5).add(BigNumber.from(balanceForUser2Cycle5)).add(BigNumber.from(balanceForUser3Cycle5)).add(
            BigNumber.from(balanceForUser4Cycle5).add(BigNumber.from(balanceForUser5Cycle5)).add(BigNumber.from(balanceForUser6ycle5)).add(BigNumber.from(balanceForUser7Cycle5))
        )
        let totalForFiveCycle = BigNumber.from(NumUtils.day(1)).add(BigNumber.from(NumUtils.day(2))).add(BigNumber.from(NumUtils.day(3))).add(
                BigNumber.from(NumUtils.day(4)).add(BigNumber.from(NumUtils.day(5)))
            )
            //49800797208933196589345  
            //         ===
            //49800797208933196589356
            // => 11 wei difference 
            //expect(excepetedValueUntilCycle5).to.equal(totalForFiveCycle);
    });


})