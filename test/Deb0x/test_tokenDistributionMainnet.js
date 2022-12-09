const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { ContractFunctionVisibility } = require("hardhat/internal/hardhat-network/stack-traces/model");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const { NumUtils } = require("../utils/NumUtils.ts");

let DEBOX_ADDRESS = "0x3a473a59820929D42c47aAf1Ea9878a2dDa93E18";
let DEBOXVIEW_ADDRESS = "0x9FBbD4cAcf0f23c2015759522B298fFE888Cf005";
let DBX_ADDRESS = "0x855201bA0e531DfdD84B41e34257165D745eE97F"
let addresses = [
    "0x845a1a2e29095c469e755456aa49b09d366f0beb"
]
async function test() {

    const Deb0x = await ethers.getContractFactory("Deb0x");
    let deb0xContract = await Deb0x.attach(DEBOX_ADDRESS);

    const Deb0xViews = await ethers.getContractFactory("Deb0xViews");
    let deb0xViewContract = await Deb0xViews.attach(DEBOXVIEW_ADDRESS);

    const DBX = await ethers.getContractFactory("Deb0xERC20");
    let dbx_erc20 = await DBX.attach(DBX_ADDRESS);

    let totalRewardUntilCurrentCycle = 0;
    let currentCycle = await deb0xContract.currentCycle();
    for (let i = 1; i <= currentCycle; i++) {
        let intermediateBalance = NumUtils.day(i);
        let middle = BigNumber.from(intermediateBalance).add(BigNumber.from(totalRewardUntilCurrentCycle))
        totalRewardUntilCurrentCycle = middle
    }

    console.log("TOTAL " + totalRewardUntilCurrentCycle)

    let totalAmountAtStakeFirstStake = BigNumber.from("0");;
    let totalAmountAtStakeaccSecondStake = BigNumber.from("0");;
    let totalBalanceOfDBX = BigNumber.from("0");
    let totalUnclaimedReward = BigNumber.from("0");

    for (let i = 0; i < addresses.length; i++) {

        let actualBalance = await dbx_erc20.balanceOf(addresses[i]);
        if (actualBalance != 0) {
            let intermediateBalance = BigNumber.from(totalBalanceOfDBX).add(BigNumber.from(actualBalance));
            totalBalanceOfDBX = intermediateBalance;
        }

        let unclaimedReward = await deb0xViewContract.getUnclaimedRewards(addresses[i]);
        if (unclaimedReward != 0) {
            let intermediatForUnclaimedReward = BigNumber.from(totalUnclaimedReward).add(BigNumber.from(unclaimedReward));
            totalUnclaimedReward = intermediatForUnclaimedReward
        }

        let stakeCycle = Number(await deb0xContract.accFirstStake(addresses[i]));
        let amountInStake = await deb0xContract.accStakeCycle(addresses[i], stakeCycle);
        if (amountInStake != 0) {
            let intermediateForStake = BigNumber.from(totalAmountAtStakeFirstStake).add(BigNumber.from(amountInStake));
            totalAmountAtStakeFirstStake = intermediateForStake;
        }

        let stakeCycle2 = Number(await deb0xContract.accSecondStake(addresses[i]));
        let amountInStake2 = await deb0xContract.accStakeCycle(addresses[i], stakeCycle2);
        totalAmountAtStakeaccSecondStake = BigNumber.from(totalAmountAtStakeaccSecondStake).add(amountInStake2);
        if (amountInStake2 != 0) {
            let intermediateForStake2 = BigNumber.from(totalAmountAtStakeaccSecondStake).add(BigNumber.from(amountInStake2));
            totalAmountAtStakeaccSecondStake = intermediateForStake2;
        }
        console.log(addresses[i])
        console.log(await deb0xViewContract.getUnclaimedFees(addresses[i]))
    }
    console.log("IN WALLET " + totalBalanceOfDBX)
    console.log("UNCLAIMED REWARD " + totalUnclaimedReward)
    console.log("IN FIRST STAKE " + totalAmountAtStakeFirstStake)
    console.log("IN SECOUND STAKE " + totalAmountAtStakeaccSecondStake)
};

test();