const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")

describe("Test stake functionality", async function() {
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
        console.log("Balance account after secound stake: " + ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address)))

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")
        let balanceInSecoundCycle = ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address));
        await user3Reward.claimRewards();
        let balanceInSecoundCycleAfterClaimRewards = ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address));
        let rewardDistributedInSecoundCyle = balanceInSecoundCycleAfterClaimRewards - balanceInSecoundCycle;
        console.log("Reward distributed from secound cycle: " + rewardDistributedInSecoundCyle);
        await user3Reward.stakeDBX(balanceBigNumberFormat)
        console.log("Balance account after third stake but in secound cycle: " + ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address)))

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let amoutToUnstakeAfterTwoStakeActionInFirstCycle = ethers.utils.formatEther(await user3Reward.getUserWithdrawableStake(user3.address));
        expect(parseInt(amoutToUnstakeAfterTwoStakeActionInFirstCycle)).to.equal(25);

        await user3Reward.stakeDBX(balanceBigNumberFormat)
        console.log("Balance account after fourth stake but in secound cycle: " + ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address)))

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let amoutToUnstakeAfterAnotherStakeInSecoundCycle = ethers.utils.formatEther(await user3Reward.getUserWithdrawableStake(user3.address));
        expect(parseFloat(amoutToUnstakeAfterAnotherStakeInSecoundCycle)).to.equal(37.5);

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")
        let amoutToUnstakeAfterAnotherStakeInThirdCyle = ethers.utils.formatEther(await user3Reward.getUserWithdrawableStake(user3.address));
        expect(parseFloat(amoutToUnstakeAfterAnotherStakeInThirdCyle)).to.equal(50);

    });

    it("Stake action from multiple accounts and check user address stake amount", async() => {
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user2Reward.claimRewards()
        await dbxERC20.connect(user2).approve(user1Reward.address, await dbxERC20.balanceOf(user2.address))
        await user2Reward.stakeDBX(await dbxERC20.balanceOf(user2.address))

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let amountStakeInFirtCyclePerAccount = ethers.utils.formatEther(BigNumber.from(await user1Reward.rewardPerCycle(1)).div(BigNumber.from("3")));
        await user1Reward.claimRewards()
        await dbxERC20.connect(user1).approve(user1Reward.address, await dbxERC20.balanceOf(user1.address))
        await user1Reward.stakeDBX(await dbxERC20.balanceOf(user1.address))

        await user2Reward.claimRewards()
        await dbxERC20.connect(user2).approve(user1Reward.address, await dbxERC20.balanceOf(user2.address))
        await user2Reward.stakeDBX(await dbxERC20.balanceOf(user2.address))

        await user3Reward.claimRewards()
        await dbxERC20.connect(user3).approve(user1Reward.address, await dbxERC20.balanceOf(user3.address))
        await user3Reward.stakeDBX(await dbxERC20.balanceOf(user3.address))

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let amountStakeInFirstCycle = ethers.utils.formatEther(await user2Reward.getUserWithdrawableStake(user2.address));
        expect(parseInt(amountStakeInFirstCycle)).to.equal(100);

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let amountStakeInSecoundCycleFirstAccount = ethers.utils.formatEther(await user1Reward.getUserWithdrawableStake(user1.address));
        expect(amountStakeInFirtCyclePerAccount).to.equal(amountStakeInSecoundCycleFirstAccount);

        let amountInSecoundCycle = ethers.utils.formatEther(BigNumber.from(await user2Reward.getUserWithdrawableStake(user2.address)).sub(BigNumber.from(await user1Reward.rewardPerCycle(0))));
        expect(amountStakeInFirtCyclePerAccount).to.equal(amountInSecoundCycle);

        let amountStakeInSecoundCycleThirdAccount = ethers.utils.formatEther(await user3Reward.getUserWithdrawableStake(user3.address));
        expect(amountStakeInFirtCyclePerAccount).to.equal(amountStakeInSecoundCycleThirdAccount);



    });


    it("Try to stake and unstake", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.claimRewards()
        await dbxERC20.connect(user3).approve(deb0xContract.address, await dbxERC20.balanceOf(user3.address))
        await user3Reward.stakeDBX(await dbxERC20.balanceOf(user3.address))

        try {
            await user2Reward.stakeDBX(await deb0xContract.getUserWithdrawableStake(user2.address))
        } catch (error) {
            expect(error.message).to.include("Deb0x: your amount is 0");
        }

        try {
            await user2Reward.unstake(await deb0xContract.getUserWithdrawableStake(user2.address))
        } catch (error) {
            expect(error.message).to.include("Deb0x: your amount is 0");
        }

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward.claimRewards()
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //WithdrawableStake value is in this moment 50 DBX, but we try to unstake 51 DBX
        try {
            await user3Reward.unstake(BigNumber.from("51000000000000000000"))
        } catch (error) {
            expect(error.message).to.include("'Deb0x: can not unstake more than you've staked'")
        }
    });



});