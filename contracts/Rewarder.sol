// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

contract Rewarder {
    uint256 initialTimestamp;
    uint256 periodDuration;
    uint256 currentCycleReward;
    uint256 lastCycleReward;

    mapping(address => uint256) userCycleMessages;
    mapping(uint256 => uint256) cycleTotalMessages;
    mapping(address => uint256) lastActiveCycle;
    mapping(address => uint256) addressRewards;
    mapping(address => uint256) public rewardsStored;
    mapping(uint256 => uint256) public rewardPerCycle;




    constructor() {
        initialTimestamp = block.timestamp;
        periodDuration = 1 days;
        currentCycleReward = 100;
        rewardPerCycle[0] = 100;
    }

    modifier notify(address account) {
        uint256 currentCycle = getCurrentCycle();
        if(rewardPerCycle[currentCycle] == 0) {
            lastCycleReward = currentCycleReward;
            uint256 calculatedCycleReward = calculateCycleReward();
            currentCycleReward = calculatedCycleReward;
            rewardPerCycle[currentCycle] = calculatedCycleReward;
        }
        if(currentCycle > lastActiveCycle[account]) {
            if(cycleTotalMessages[lastActiveCycle[account]] != 0) {
                addressRewards[account] += userCycleMessages[account] * rewardPerCycle[lastActiveCycle[account]] / cycleTotalMessages[lastActiveCycle[account]];
            }
            userCycleMessages[account] = 0;
        }
        _;
    }

    function send() public notify(msg.sender){
        uint256 currentCycle = getCurrentCycle(); 

        userCycleMessages[msg.sender]++;
        cycleTotalMessages[currentCycle]++;
        lastActiveCycle[msg.sender] = currentCycle;
    }

    function getCurrentCycle() public view returns(uint256){
        return (block.timestamp - initialTimestamp) / periodDuration ;
    }

    // function getCycleReward(uint256 cycle) public pure returns(uint256){
    //     if(cycle == 0) {
    //         return 100;
    //     }
    //     return 100 / ((10019 / 10000) ** cycle);
    // }

    function calculateCycleReward() public view returns(uint256){
        return lastCycleReward * 10000 / 10019;
    }

    function claimRewards() public notify(msg.sender){
        rewardsStored[msg.sender] = addressRewards[msg.sender];
        addressRewards[msg.sender] = 0;
    }

}