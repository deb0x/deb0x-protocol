const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.only("Test contract", async function () {
  let rewardedAlice, rewardedBob, rewardedCarol;
  let alice, bob;
  beforeEach("Set enviroment", async () => {
    [alice, bob, carol] = await ethers.getSigners();

    const Rewarder = await ethers.getContractFactory("Rewarder");
    rewardedAlice = await Rewarder.deploy();
    await rewardedAlice.deployed();

    rewardedBob = rewardedAlice.connect(bob)
    rewardedCarol = rewardedAlice.connect(carol)
  });

  it("Should claim no rewards after 2 cycles pass", async () => {

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 2])
    await hre.ethers.provider.send("evm_mine")

    const claimedRewards = await rewardedAlice.claimRewards()
    console.log(await rewardedAlice.rewardsStored(alice.address))
  });

  it("Should claim no rewards for sending a message in the current cycle", async () => {

    await rewardedAlice.send()

    const claimedRewards = await rewardedAlice.claimRewards()
    console.log(await rewardedAlice.rewardsStored(alice.address))
  });


  it("Should claim share of rewards after sending a message in the previous day", async () => {
    //console.log(await rewardedAlice.getCurrentCycleReward())
    await rewardedAlice.send()
    await rewardedBob.send()
    await rewardedBob.send()

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    const claimedRewards = await rewardedAlice.claimRewards()
    console.log(await rewardedAlice.rewardsStored(alice.address))
  });
  
  it("Should be able to claim previous cycle rewards and not reset current messages counter", async () => {
    //console.log(await rewardedAlice.getCycleReward(0), await rewardedAlice.getCycleReward(1))
    await rewardedAlice.send()
    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice.send()    

    await rewardedAlice.claimRewards()
    console.log(await rewardedAlice.rewardsStored(alice.address))

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice.claimRewards()
    console.log(await rewardedAlice.rewardsStored(alice.address))
  });

  it("Should be able to claim previous 2 cycles rewards", async () => {
    //console.log(await rewardedAlice.getCurrentCycle())
    await rewardedAlice.send()
    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice.send()    

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice.claimRewards()
    console.log(await rewardedAlice.rewardsStored(alice.address))
  });

  it("Should claim share of rewards after sending a message in the previous day", async () => {
    
    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice.send()

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedBob.send()
    await rewardedAlice.send()
    await rewardedAlice.send()

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 2])
    await hre.ethers.provider.send("evm_mine")

    await rewardedCarol.send()

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    for(let i = 0; i < 5; i++) {
      console.log(await rewardedAlice.rewardPerCycle(i))
    }

    await rewardedAlice.claimRewards()
    await rewardedBob.claimRewards()
    await rewardedCarol.claimRewards()
    console.log("Alice " + await rewardedAlice.rewardsStored(alice.address))
    console.log("Bob " + await rewardedAlice.rewardsStored(bob.address))
    console.log("Carol " + await rewardedAlice.rewardsStored(carol.address))
  });
});