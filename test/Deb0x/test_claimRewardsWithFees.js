const { expect } = require("chai");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")

describe("Test contract", async function () {
  let rewardedAlice, rewardedBob, rewardedCarol, dbxERC20;
  let alice, bob;
  beforeEach("Set enviroment", async () => {
    [alice, bob, carol, messageReceiver, feeReceiver] = await ethers.getSigners();

    const Deb0x = await ethers.getContractFactory("Deb0x");
    rewardedAlice = await Deb0x.deploy();
    await rewardedAlice.deployed();

    const dbxAddress = await rewardedAlice.dbx()
    dbxERC20 = new ethers.Contract(dbxAddress, abi, hre.ethers.provider)

    rewardedBob = rewardedAlice.connect(bob)
    rewardedCarol = rewardedAlice.connect(carol)
  });

  it(`
  #1 Cycle - 100 DBX reward
  A(F1-1%)
  ---------
  A claimable rewards = 99 DBX
  `, async () => {

    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 ])
    await hre.ethers.provider.send("evm_mine")

    const claimedRewards = await rewardedAlice.claimRewards()
    console.log(ethers.utils.formatEther(await dbxERC20.balanceOf(alice.address)))
  });


  it(`
  #1 Cycle - 100 DBX reward
  A(F1-10%),  A(F1-4%),  A(F1-60%)
  ---------
  A claimable rewards ~ 93,3 DBX
  `, async () => {

    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 400, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 600, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    const claimedRewards = await rewardedAlice.claimRewards()
    console.log(ethers.utils.formatEther(await dbxERC20.balanceOf(alice.address)))
  });
  
  it(`
  #1 Cycle - 100 DBX reward
  A(F1-10%)
  ---------
  A claimable rewards = 45.5 DBX
  `, async () => {
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1100, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 900, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1500, 0, { value: ethers.utils.parseEther("1") })

    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    
    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice.claimRewards()
    console.log(ethers.utils.formatEther(await dbxERC20.balanceOf(alice.address)))
  });

  // it("Should be able to claim previous 2 cycles rewards", async () => {
  //   //console.log(await rewardedAlice.getCurrentCycle())
  //   await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0)
  //   await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
  //   await hre.ethers.provider.send("evm_mine")

  //   await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0)    

  //   await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
  //   await hre.ethers.provider.send("evm_mine")

  //   await rewardedAlice.claimRewards()
  //   console.log(await dbxERC20.balanceOf(alice.address))
  // });

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