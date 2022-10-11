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

    it("Stake action from a single account and check user address stake amount", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.claimRewards()
        let user3Balance = await dbxERC20.balanceOf(user3.address);
        //User3balanceDiv 4 will be 12.5 (50/4)
        let user3BalanceDiv4 = user3Balance / 4;
        let balanceBigNumberFormat = BigNumber.from(user3BalanceDiv4.toString());
        await dbxERC20.connect(user3).approve(deb0xContract.address, user3Balance)
        await user3Reward.stakeDBX(balanceBigNumberFormat)

        console.log("Balance account after first stake: " + ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address)))
        await user3Reward.stakeDBX(balanceBigNumberFormat)
        console.log("Balance account after second stake: " + ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address)))

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")
        await user3Reward.claimRewards();
        await user3Reward.stakeDBX(balanceBigNumberFormat)
        console.log("Balance account after third stake but in second cycle: " + ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address)))
        console.log("Acc  " + ethers.utils.formatEther(await user3Reward.getUserWithdrawableStake(user3.address)))

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let valueToUnstake = await user3Reward.getUserWithdrawableStake(user3.address);
        console.log(valueToUnstake)
        expect(valueToUnstake).to.equal("37500000000000000000")
        console.log("Valoare la care trebuie facut unstake: " + ethers.utils.formatEther(valueToUnstake))
        await user3Reward.unstake("37000000000000000000")

        console.log("Valoare dupa unstake  " + ethers.utils.formatEther(await user3Reward.getUserWithdrawableStake(user3.address)))

        let amoutToUnstakeAfterTwoStakeActionInFirstCycle = ethers.utils.formatEther(await user3Reward.getUserWithdrawableStake(user3.address));
        console.log("Valoare dupa unstake  " + amoutToUnstakeAfterTwoStakeActionInFirstCycle);

    });

});