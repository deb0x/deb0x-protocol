const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Test contract", async function () {
  let erc20a, erc20b, stakeContract
  let deployer, user;
  beforeEach("Set enviroment", async () => {
    [deployer, user] = await ethers.getSigners();

    //deploy ERC20 staking token
    const ERC20A = await ethers.getContractFactory("ERC20Standard");
    erc20a = await ERC20A.connect(user).deploy();
    await erc20a.deployed();

    //deploy ERC20 reward token
    const ERC20B = await ethers.getContractFactory("ERC20StandardB");
    erc20b = await ERC20B.connect(user).deploy();
    await erc20b.deployed();

    const Contract = await ethers.getContractFactory("StakingRewards");
    stakeContract = await Contract.connect(deployer).deploy(erc20a.address, erc20b.address);
    await stakeContract.deployed();

    await erc20a.connect(user).approve(stakeContract.address, 100000);
    await erc20b.connect(user).approve(stakeContract.address, 100000);
    await erc20b.connect(user).transfer(stakeContract.address, 100000);
  });


  it("Hello", async () => {
    await stakeContract.connect(user).stake(100);
    await stakeContract.connect(user).withdraw(100);
    await stakeContract.connect(user).stake(100)
  });

});