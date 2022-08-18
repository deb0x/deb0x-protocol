const fs = require('fs')
const { BigNumber } = require("ethers");
async function calculateRewardDistribution() {
    let lastReward = BigNumber.from("100000000000000000000");
    let actualReward = 0;
    let iteration = 0;
    let totalRewad = BigNumber.from("10000000000000000000000");
    while (lastReward > 0) {
        actualReward = (lastReward.mul(BigNumber.from("10000"))).div(BigNumber.from("10019"));
        lastReward = actualReward;
        totalRewad = BigNumber.from(totalRewad).add(BigNumber.from(lastReward))
        console.log(ethers.utils.formatEther(lastReward))
        fs.appendFile('result.txt', ethers.utils.formatEther(lastReward) + '\n', err => {
            if (err) {
                console.error(err);
            }
        });
        iteration++;
    }
    console.log("Numar de iteratii ->>> " + iteration + " " + ethers.utils.formatEther(totalRewad))
}

calculateRewardDistribution()