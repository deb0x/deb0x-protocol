// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./Deb0xCore.sol";
import "./DBX.sol";

contract Deb0x is Ownable, Deb0xCore {
    //Message setup
    DBX public dbx;
    uint16 public fee = 1000;
    uint256 initialTimestamp;
    uint256 periodDuration;
    uint256 currentCycleReward;
    uint256 lastCycleReward;

    mapping(address => uint256) userCycleFeePercent;
    mapping(address => uint256) frontendCycleFeePercent;
    mapping(address => uint256) userCycleMessages;
    mapping(uint256 => uint256) cycleTotalMessages;
    mapping(address => uint256) lastActiveCycle;
    mapping(address => uint256) frontEndLastCycleUpdate;
    mapping(address => uint256) addressRewards;
    mapping(address => uint256) frontendRewards;
    mapping(uint256 => uint256) public rewardPerCycle;

    uint256 public totalSupply;

    constructor() {
        dbx = new DBX();
        initialTimestamp = block.timestamp;
        periodDuration = 1 days;
        currentCycleReward = 100 * 1e18;
        rewardPerCycle[0] = 100 * 1e18;
    }

    modifier notify(address account) {
        uint256 currentCycle = getCurrentCycle();
        if(rewardPerCycle[currentCycle] == 0) {
            lastCycleReward = currentCycleReward;
            uint256 calculatedCycleReward = calculateCycleReward();
            currentCycleReward = calculatedCycleReward;
            rewardPerCycle[currentCycle] = calculatedCycleReward;
        }
        if(currentCycle > lastActiveCycle[account] && cycleTotalMessages[lastActiveCycle[account]] != 0) {
            uint256 lastCycleUserReward = userCycleMessages[account] * rewardPerCycle[lastActiveCycle[account]] / cycleTotalMessages[lastActiveCycle[account]];
            if(cycleTotalMessages[lastActiveCycle[account]] != 0) {
                addressRewards[account] += lastCycleUserReward;
            }
            if(userCycleFeePercent[account] != 0) {
                uint256 rewardPerMsg = lastCycleUserReward / userCycleMessages[account];
                uint256 rewardsOwed = rewardPerMsg * userCycleFeePercent[account] / 10000;
                addressRewards[account] -= rewardsOwed;
                userCycleFeePercent[account] = 0;
            }
            userCycleMessages[account] = 0;
        }
        _;
    }

    function updateFrontEndReward(address frontend, uint256 currentCycle) internal {
        if(currentCycle > frontEndLastCycleUpdate[frontend]) {
            if(frontendCycleFeePercent[frontend] != 0) {
                uint256 lastUpdatedCycle = frontEndLastCycleUpdate[frontend];
                uint256 rewardPerMsg = rewardPerCycle[lastUpdatedCycle] / cycleTotalMessages[lastUpdatedCycle];
                frontendRewards[frontend] += rewardPerMsg * frontendCycleFeePercent[frontend] / 10000;
                frontendCycleFeePercent[frontend] = 0;
            }
            frontEndLastCycleUpdate[frontend] = currentCycle;
        }
    }

    function setFee(uint16 newFee) public onlyOwner {
        fee = newFee;
    }

    function send(address[] memory to, string[] memory payload, address feeReceiver, uint256 msgFee)
        public
        notify(msg.sender)
    {
        uint256 currentCycle = getCurrentCycle();

        updateFrontEndReward(feeReceiver, currentCycle);

        //uint256 startGas = gasleft();

        userCycleMessages[msg.sender]++;
        cycleTotalMessages[currentCycle]++;
        lastActiveCycle[msg.sender] = currentCycle;

        if(feeReceiver != address(0) && fee != 0) {
            userCycleFeePercent[msg.sender]+= msgFee;
            frontendCycleFeePercent[feeReceiver]+= msgFee;
        }

        super.send(to, payload);

        // messagesSent[msg.sender] += 1;
        // totalSupply += 1;
    
        //uint256 gasUsed = startGas - gasleft();
        //require(
            //msg.value >=
                //((gasUsed+ 21000 + 50000) * tx.gasprice  * fee) / 10000,
            //"Deb0x: must pay 10% of transaction cost"
        //);
    }

    function claimRewards() public notify(msg.sender) {
        uint256 reward = addressRewards[msg.sender];
        addressRewards[msg.sender] = 0;
        dbx.mintReward(msg.sender, reward);
    }

    function claimFrontEndRewards() public {
        uint256 currentCycle = getCurrentCycle();
        updateFrontEndReward(msg.sender, currentCycle);

        uint256 reward = frontendRewards[msg.sender];
        frontendRewards[msg.sender] = 0;
        dbx.mintReward(msg.sender, reward);
    }

    // function stakeERC20(uint256 _amount)
    //     external
    //     payable
    //     updateReward(msg.sender)
    // {
    //     require(_amount != 0, "Deb0x: your amount is 0");

    //     totalSupply += _amount;
    //     balanceERC20[msg.sender] += _amount;

    //     deboxERC20.transferFrom(msg.sender, address(this), _amount);
    // }

    // function unStakeERC20(uint256 _amount) external updateReward(msg.sender) {
    //     require(_amount != 0, "Deb0x: your amount is 0");
    //     require(
    //         balanceERC20[msg.sender] - _amount >= 0,
    //         "Deb0x: insufficient balance"
    //     );

    //     totalSupply -= _amount;
    //     balanceERC20[msg.sender] -= _amount;
    //     deboxERC20.transferFrom(address(this), msg.sender, _amount);
    // }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getCurrentCycle() public view returns(uint256){
        return (block.timestamp - initialTimestamp) / periodDuration ;
    }

    function calculateCycleReward() public view returns(uint256){
        return lastCycleReward * 10000 / 10019;
    }
}