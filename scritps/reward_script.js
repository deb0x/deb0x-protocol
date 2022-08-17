const { ethers } = require("hardhat");
const { abi } = require("../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const fs = require('fs')

async function calculateRewardDistribution() {
    let userReward, user1Reward, user2Reward, frontend;
    let user1, user2, user3, user4;
    [user1, user2, user3, user4, messageReceiver, feeReceiver] = await ethers.getSigners();

    const Deb0x = await ethers.getContractFactory("Deb0x");
    userReward = await Deb0x.deploy();
    await userReward.deployed();

    user1Reward = userReward.connect(user1)
    frontend = userReward.connect(feeReceiver)

    await user2.sendTransaction({
        to: user1.address,
        value: ethers.utils.parseEther("100.0")
    })
    await user3.sendTransaction({
        to: user1.address,
        value: ethers.utils.parseEther("100.0")
    })
    await user4.sendTransaction({
        to: user1.address,
        value: ethers.utils.parseEther("100.0")
    })
    let reward = 100;
    while (reward > 0) {
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")
        let reward = ethers.utils.formatEther(await user1Reward.calculateCycleReward());
        fs.appendFile('result.txt', reward + '\n', err => {
            if (err) {
                console.error(err);
            }
        });
    }

}

calculateRewardDistribution()