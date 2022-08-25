const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")

describe("Test contract functionalities while having cycles with no messages sent", async function () {
    let rewardedAlice, rewardedBob, rewardedCarol, frontend, dbxERC20;
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
      frontend = rewardedAlice.connect(feeReceiver)
    });


  it("Should claim rewards from first day", async () => {
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [2 * 60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice.claimRewards()
    expect(await dbxERC20.balanceOf(alice.address)).to.equal(ethers.utils.parseEther("75"))

    await hre.ethers.provider.send("evm_increaseTime", [2 * 60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedBob.claimRewards()
    expect(await dbxERC20.balanceOf(bob.address)).to.equal(ethers.utils.parseEther("25"))
  });
  
  it("Should be able to claim previous cycle rewards and not reset current messages counter", async () => {
    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    
    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice.claimRewards()
    await rewardedBob.claimRewards()
    expect(await dbxERC20.balanceOf(bob.address)).to.equal(ethers.utils.parseEther("99.810360315400738596"))
    expect(await dbxERC20.balanceOf(alice.address)).to.equal(ethers.utils.parseEther("199.621080262901226266"))
  });

  it(`
  5 ether gathered as fees should be fully distributed back to users/frontends
  `, async () => {

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

    await hre.ethers.provider.send("evm_increaseTime", [2 * 60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")
    await frontend.claimFrontEndFees();
    
    await hre.ethers.provider.send("evm_increaseTime", [2 * 60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")
    await rewardedAlice.claimFees()
    await rewardedBob.claimFees()
    
    const feesClaimed = await rewardedAlice.queryFilter("FeesClaimed")
    let totalFeesClaimed = BigNumber.from("0")
    for(let entry of feesClaimed){
      totalFeesClaimed = totalFeesClaimed.add(entry.args.fees)
    }
    expect(totalFeesClaimed).to.equal(BigNumber.from("5000000000000000000"))
  });

  it("Should claim ~99.81 tokens despite gaps before and after sending message", async () => {


    await hre.ethers.provider.send("evm_increaseTime", [2 * 60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    const aliceBalance = await hre.ethers.provider.getBalance(alice.address)
    console.log(ethers.utils.formatEther(aliceBalance))
    const tx = await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("100") })
    const receipt = await tx.wait()
    console.log(receipt)
    const aliceBalanceAfterSend = await hre.ethers.provider.getBalance(alice.address)
    const txCostPlusFees = aliceBalance.sub(aliceBalanceAfterSend)
    const txCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice)
    const txCostEstimate = txCost.add(txCost.div(BigNumber.from("10")))
    expect(txCostPlusFees).to.equal(txCostEstimate)
    // const fee = ethers.utils.parseEther("100").sub(BigNumber.from("99999921650105078643"))
    // console.log(fee.add(fee.div(BigNumber.from("10"))))
    // console.log(ethers.utils.formatEther(await hre.ethers.provider.getBalance(alice.address)))

    await hre.ethers.provider.send("evm_increaseTime", [2 * 60 * 60 * 24])
    await hre.ethers.provider.send("evm_mine")

    await rewardedAlice.claimRewards()
    expect(await dbxERC20.balanceOf(alice.address)).to.equal(ethers.utils.parseEther("99.810360315400738596"))
  });
});