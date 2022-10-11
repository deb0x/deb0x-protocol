const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")

describe("Test fee claiming for users/frontends without concurrently staking/unstaking", async function () {
  let rewardedAlice, rewardedBob, rewardedCarol, frontend, dbxERC20;
  let alice, bob;
  beforeEach("Set enviroment", async () => {
    [alice, bob, carol, messageReceiver, feeReceiver] = await ethers.getSigners();

    const Deb0x = await ethers.getContractFactory("Deb0x");
    rewardedAlice = await Deb0x.deploy(ethers.constants.AddressZero);
    await rewardedAlice.deployed();

    const dbxAddress = await rewardedAlice.dbx()
    dbxERC20 = new ethers.Contract(dbxAddress, abi, hre.ethers.provider)

    rewardedBob = rewardedAlice.connect(bob)
    rewardedCarol = rewardedAlice.connect(carol)
    frontend = rewardedAlice.connect(feeReceiver)
  });

  it(`
  5 ether gathered as fees should be fully distributed back to users/frontends
  `, async () => {

    const aliceBalance = await hre.ethers.provider.getBalance(alice.address)
    console.log(ethers.utils.formatEther(aliceBalance))
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
    feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("1") })
    
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
      feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
      feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
      feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
      feeReceiver.address, 100, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    
    await rewardedAlice.claimFees()
    await rewardedBob.claimFees()
    await frontend.claimFrontEndFees();
    const feesClaimed = await rewardedAlice.queryFilter("FeesClaimed")
    let totalFeesClaimed = BigNumber.from("0")
    for(let entry of feesClaimed){
      totalFeesClaimed = totalFeesClaimed.add(entry.args.fees)
    }
    const feesCollected = await rewardedAlice.cycleAccruedFees(0);

    const remainder = await hre.ethers.provider.getBalance(rewardedAlice.address);
    console.log(`remainder: ${remainder}`);
    expect(totalFeesClaimed.add(remainder)).to.equal(feesCollected)
  });

  it(`
  5 ether gathered as fees should be fully distributed back to users/frontends
  `, async () => {

    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
      ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
      ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
      ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
      ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
      ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice.claimFees()
    await rewardedBob.claimFees()
    const feesClaimed = await rewardedAlice.queryFilter("FeesClaimed")
    let totalFeesClaimed = BigNumber.from("0")
    for(let entry of feesClaimed){
      totalFeesClaimed = totalFeesClaimed.add(entry.args.fees)
    }
    const feesCollected = await rewardedAlice.cycleAccruedFees(0);

    const remainder = await hre.ethers.provider.getBalance(rewardedAlice.address);
    console.log(`remainder: ${remainder}`);
    expect(totalFeesClaimed.add(remainder)).to.equal(feesCollected)
  });

  it(`
  4 ether gathered as fees should be fully distributed back to users
  `, async () => {

    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })


    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedCarol["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice.claimFees()
    await rewardedBob.claimFees()
    await rewardedCarol.claimFees()
    const feesClaimed = await rewardedAlice.queryFilter("FeesClaimed")
    let totalFeesClaimed = BigNumber.from("0")
    for(let entry of feesClaimed){
      totalFeesClaimed = totalFeesClaimed.add(entry.args.fees)
    }
    const feesCollected = (await rewardedAlice.cycleAccruedFees(0)).add(await rewardedAlice.cycleAccruedFees(1));

    const remainder = await hre.ethers.provider.getBalance(rewardedAlice.address);
    console.log(`remainder: ${remainder}`);
    expect(totalFeesClaimed.add(remainder)).to.equal(feesCollected)
  });

  it(`
  6 ether gathered as fees should be fully distributed back to users
  `, async () => {
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })


    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    
    await rewardedAlice.claimFees()
    
    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedBob.claimFees()
    await rewardedCarol["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address],
      ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })


    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")


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
      .add(await rewardedAlice.cycleAccruedFees(3));
    
    const remainder = await hre.ethers.provider.getBalance(rewardedAlice.address);
    console.log(`remainder: ${remainder}`);  
    expect(totalFeesClaimed.add(remainder)).to.equal(feesCollected)
  });

  it("11 ether gathered as fees should be fully distributed back to userss", async () => {
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
      .add(await rewardedAlice.cycleAccruedFees(2));

    const remainder = await hre.ethers.provider.getBalance(rewardedAlice.address);
    console.log(`remainder: ${remainder}`);  
    expect(totalFeesClaimed.add(remainder)).to.equal(feesCollected)
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