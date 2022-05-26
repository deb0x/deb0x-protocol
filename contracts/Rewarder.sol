// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

contract Rewarder {

    uint256 rewardPerCycle = 100;
    uint256 initialTimestamp;
    uint256 periodDuration;

    mapping(address => uint256) userCycleMessages;
    mapping(uint256 => uint256) cycleTotalMessages;
    mapping(address => uint256) lastActiveCycle;
    mapping(address => uint256) addressRewards;
    mapping(address => uint256) public rewardsStored;

    constructor() {
        initialTimestamp = block.timestamp;
        periodDuration = 1 days;
    }

    modifier notify(address account) {
        uint256 currentCycle = getCurrentCycle();
        if(currentCycle > lastActiveCycle[account]) {
            if(cycleTotalMessages[lastActiveCycle[account]] != 0) {
                addressRewards[account] += userCycleMessages[account] * rewardPerCycle / cycleTotalMessages[lastActiveCycle[account]];
            }
            //lastActiveCycle[account] = currentCycle;
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

    function claimRewards() public notify(msg.sender){
        rewardsStored[msg.sender] = addressRewards[msg.sender];
        addressRewards[msg.sender] = 0;
    }

}