const fs = require('fs')
const { BigNumber } = require("ethers");
async function calculateRewardDistribution() {
    let reward = BigNumber.from("100000000000000000000");
    let lastReward = 0;
    let iteration = 0;
    while (reward > 0) {
        lastReward = (reward.mul(BigNumber.from("10000000000000000000000"))).div(BigNumber.from("10019000000000000000000"));
        reward = lastReward;
        console.log(ethers.utils.formatEther(reward))
        fs.appendFile('result.txt', ethers.utils.formatEther(reward) + '\n', err => {
            if (err) {
                console.error(err);
            }
        });
        iteration++;
    }
    console.log("Numar de iteratii ->>> " + iteration)
}

calculateRewardDistribution()