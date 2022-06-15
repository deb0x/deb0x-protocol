const { expect } = require("chai");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")

describe("Test contract", async function () {
  let debox, deboxERC20, deboxUser;
  let deployer, user;
  beforeEach("Set enviroment", async () => {
    [deployer, user] = await ethers.getSigners();

    const Debox = await ethers.getContractFactory("Deb0x");
    debox = await Debox.deploy();
    await debox.deployed();

    deboxERC20 = new ethers.Contract(await debox.deboxERC20(), abi, hre.ethers.provider)
    deboxUser = debox.connect(user)
  });


  it("Hello", async () => {
    await debox.notifyRewardAmount("1000000000")
    console.log(await deboxERC20.balanceOf(debox.address))
    await deboxUser["send()"]()
    await deboxUser["send()"]()
    await deboxUser["send()"]()

    // await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 12])
    // await hre.ethers.provider.send("evm_mine")

    await debox["send()"]()
    await debox["send()"]()
    await debox["send()"]()
    console.log(await debox.earned(user.getAddress()))
    console.log(await debox.earned(deployer.getAddress()))

    await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 + 60])
    await hre.ethers.provider.send("evm_mine")

    const earnedUser = await debox.earned(user.getAddress())
    const earnedDeployer = await debox.earned(deployer.getAddress())
    console.log(earnedUser)
    console.log(earnedDeployer)
    console.log(earnedDeployer.add(earnedUser))
  });

});