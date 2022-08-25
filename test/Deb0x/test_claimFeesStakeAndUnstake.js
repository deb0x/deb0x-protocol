const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")

describe("Test contract", async function () {
  let rewardedAlice, rewardedBob, rewardedCarol, rewardedDean, dbxERC20;
  let alice, bob;
  beforeEach("Set enviroment", async () => {
    [alice, bob, carol, dean, messageReceiver, feeReceiver] = await ethers.getSigners();

    const Deb0x = await ethers.getContractFactory("Deb0x");
    rewardedAlice = await Deb0x.deploy();
    await rewardedAlice.deployed();

    const dbxAddress = await rewardedAlice.dbx()
    dbxERC20 = new ethers.Contract(dbxAddress, abi, hre.ethers.provider)

    rewardedBob = rewardedAlice.connect(bob)
    rewardedCarol = rewardedAlice.connect(carol)
    rewardedDean = rewardedAlice.connect(dean)
  });

  it.only("11 ether gathered as fees should be fully distributed back to users", async () => {
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedCarol["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedCarol["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedCarol["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")
    
    await rewardedCarol.claimRewards()
    const carolDBXBalance = await dbxERC20.balanceOf(carol.address)
    await dbxERC20.connect(carol).transfer(bob.address, carolDBXBalance.div(BigNumber.from("2")))
    await dbxERC20.connect(bob).approve(rewardedAlice.address, await dbxERC20.balanceOf(bob.address))
    await rewardedBob.stakeDBX(await dbxERC20.balanceOf(bob.address))
    await dbxERC20.connect(carol).transfer(alice.address, await dbxERC20.balanceOf(carol.address))
    await dbxERC20.connect(alice).approve(rewardedAlice.address, await dbxERC20.balanceOf(alice.address))
    await rewardedAlice.stakeDBX(await dbxERC20.balanceOf(alice.address))

    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    

    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob.claimRewards()
    await rewardedCarol["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    // console.log(ethers.utils.formatEther(await rewardedAlice.getUserWithdrawableStake(alice.address)), 
    //     ethers.utils.formatEther(await rewardedAlice.addressRewards(alice.address)))
    await rewardedAlice.unstake(await rewardedAlice.getUserWithdrawableStake(alice.address))
    await rewardedAlice.claimRewards()
    

    await rewardedAlice.claimFees()
    await rewardedBob.claimFees()
    await rewardedCarol.claimFees()
    const feesClaimed = await rewardedAlice.queryFilter("FeesClaimed")
    let totalFeesClaimed = BigNumber.from("0")
    for(let entry of feesClaimed){
      totalFeesClaimed = totalFeesClaimed.add(entry.args.fees)
    }
    const feesCollected = (await rewardedAlice.cycleAccruedFees(0))
      .add(await rewardedAlice.cycleAccruedFees(1))
      .add(await rewardedAlice.cycleAccruedFees(2))
    expect(totalFeesClaimed).to.equal(feesCollected)
  });

  // it("Should claim share of rewards after sending a message in the previous day", async () => {

  //   await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
  //   await hre.ethers.provider.send("evm_mine")

  //   await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0)

  //   await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
  //   await hre.ethers.provider.send("evm_mine")

  //   await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0)
  //   await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0)
  //   await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0)

  //   await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 2])
  //   await hre.ethers.provider.send("evm_mine")

  //   await rewardedCarol["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0)

  //   await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
  //   await hre.ethers.provider.send("evm_mine")

  //   for(let i = 0; i < 5; i++) {
  //     console.log(await rewardedAlice.rewardPerCycle(i))
  //   }

  //   await rewardedAlice.claimRewards()
  //   await rewardedBob.claimRewards()
  //   await rewardedCarol.claimRewards()
  //   console.log("Alice " + await dbxERC20.balanceOf(alice.address))
  //   console.log("Bob " + await dbxERC20.balanceOf(bob.address))
  //   console.log("Carol " + await dbxERC20.balanceOf(carol.address))
  // });
});