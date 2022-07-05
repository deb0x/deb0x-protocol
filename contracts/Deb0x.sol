// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./Deb0xCore.sol";
import "./DBX.sol";
import "hardhat/console.sol";

contract Deb0x is Deb0xCore {
    //Message setup
    struct Stake {
        uint256 stakeCycle;

        uint256 stakeAmount;
    }

    DBX public dbx;
    uint16 public constant MAIL_FEE = 1000;
    uint256 immutable i_initialTimestamp;
    uint256 immutable i_periodDuration;
    uint256 currentCycleReward;
    uint256 lastCycleReward;
    uint256 pendingStake;

    mapping(address => uint256) userCycleFeePercent;
    mapping(address => uint256) frontendCycleFeePercent;
    mapping(address => uint256) userCycleMessages;
    mapping(uint256 => uint256) cycleTotalMessages;
    mapping(address => uint256) lastActiveCycle;
    mapping(address => uint256) frontEndLastRewardUpdate;
    mapping(address => uint256) frontEndLastFeeUpdate;
    mapping(address => uint256) frontEndAccruedFees;
    mapping(address => uint256) public addressRewards;
    mapping(address => uint256) public addressAccruedFees;
    mapping(address => uint256) frontendRewards;
    mapping(uint256 => uint256) public rewardPerCycle;
    mapping(uint256 => uint256) public summedCycleStakes;
    mapping(address => uint256) lastFeeUpdateCycle;
    mapping(uint256 => uint256) cycleAccruedFees;
    mapping(uint256 => uint256) public cycleFeesPerStake;
    mapping(uint256 => uint256) public cycleFeesPerStakeSummed;
    mapping(address => mapping(uint256 => uint256)) userStakeCycle;
    mapping(address => uint256) public userWithdrawableStake;
    mapping(address => uint256) userFirstStake;
    mapping(address => uint256) userSecondStake;

    event FeesClaimed(uint256 fees);

    constructor() {
        dbx = new DBX();
        i_initialTimestamp = block.timestamp;
        i_periodDuration = 1 days;
        currentCycleReward = 100 * 1e18;
        summedCycleStakes[0] = 100 * 1e18;
        rewardPerCycle[0] = 100 * 1e18;
    }

    modifier setUpNewCycle() {
        uint256 currentCycle = getCurrentCycle();
        if(rewardPerCycle[currentCycle] == 0) {
            lastCycleReward = currentCycleReward;
            uint256 calculatedCycleReward = calculateCycleReward();
            currentCycleReward = calculatedCycleReward;
            rewardPerCycle[currentCycle] = calculatedCycleReward;
        }
        _;
    }

    modifier notify(address account) {
        uint256 currentCycle = getCurrentCycle();
        if(summedCycleStakes[currentCycle] == 0) {
            uint256 calculatedCycleReward = calculateCycleReward();
            summedCycleStakes[currentCycle] += summedCycleStakes[currentCycle - 1] + pendingStake + calculatedCycleReward;
            pendingStake = 0;
            uint256 feePerStake = cycleAccruedFees[currentCycle - 1] * 1e18 / summedCycleStakes[currentCycle - 1];
            cycleFeesPerStakeSummed[currentCycle] = cycleFeesPerStakeSummed[currentCycle - 1] + feePerStake;
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
        
        if(currentCycle > lastFeeUpdateCycle[account]){
            addressAccruedFees[account] = addressAccruedFees[account] + ((addressRewards[account] 
                * (cycleFeesPerStakeSummed[currentCycle] - cycleFeesPerStakeSummed[lastFeeUpdateCycle[account]]))) / 1e18;
            lastFeeUpdateCycle[account] = currentCycle;
        }

        if(userFirstStake[account] != 0 && currentCycle - userFirstStake[account] > 1) {
            uint256 unlockedFirstStake = userStakeCycle[account][userFirstStake[account] + 1];
            addressRewards[account] += unlockedFirstStake;
            userWithdrawableStake[account] += unlockedFirstStake;
            addressAccruedFees[account] = addressAccruedFees[account] + 
                ((userStakeCycle[account][userFirstStake[account] + 1] 
                * (cycleFeesPerStakeSummed[currentCycle] - cycleFeesPerStakeSummed[userFirstStake[account] + 1]))) / 1e18;
            userStakeCycle[account][userFirstStake[account] + 1] = 0;
            userFirstStake[account] = 0;

            if(userSecondStake[account] != 0) {
                if(currentCycle - userSecondStake[account] > 1) {
                        uint256 unlockedSecondStake = userStakeCycle[account][userSecondStake[account] + 1];
                        addressRewards[account] += unlockedSecondStake;
                        userWithdrawableStake[account] += unlockedSecondStake;
                        addressAccruedFees[account] = addressAccruedFees[account] + 
                            ((userStakeCycle[account][userSecondStake[account] + 1] 
                            * (cycleFeesPerStakeSummed[currentCycle] - cycleFeesPerStakeSummed[userSecondStake[account] + 1]))) / 1e18;
                        userStakeCycle[account][userSecondStake[account] + 1] = 0;
                        userSecondStake[account] = 0;
                        } else {
                            userFirstStake[account] = userSecondStake[account];
                            userSecondStake[account] = 0;
                        }
                    }
        }
        _;
    }

    function updateFrontEndStats(address frontend, uint256 currentCycle) internal {
        if(currentCycle > frontEndLastRewardUpdate[frontend]) {
            if(frontendCycleFeePercent[frontend] != 0) {
                uint256 lastUpdatedCycle = frontEndLastRewardUpdate[frontend];
                uint256 rewardPerMsg = rewardPerCycle[lastUpdatedCycle] / cycleTotalMessages[lastUpdatedCycle];
                frontendRewards[frontend] += rewardPerMsg * frontendCycleFeePercent[frontend] / 10000;
                frontendCycleFeePercent[frontend] = 0;
            }
            frontEndLastRewardUpdate[frontend] = currentCycle;
        }
        if(currentCycle > frontEndLastFeeUpdate[frontend]) {
            frontEndAccruedFees[frontend] += (frontendRewards[frontend] 
                * (cycleFeesPerStakeSummed[currentCycle] - cycleFeesPerStakeSummed[frontEndLastFeeUpdate[frontend]])) / 1e18;
            frontEndLastFeeUpdate[frontend] = currentCycle;
        }
    }

    function send(address[] memory to, string[] memory payload, address feeReceiver, uint256 msgFee)
        public
        payable
        setUpNewCycle
        notify(msg.sender)
    {
        uint256 currentCycle = getCurrentCycle();

        updateFrontEndStats(feeReceiver, currentCycle);

        uint256 startGas = gasleft();

        userCycleMessages[msg.sender]++;
        cycleTotalMessages[currentCycle]++;
        lastActiveCycle[msg.sender] = currentCycle;

        if(feeReceiver != address(0) && MAIL_FEE != 0) {
            userCycleFeePercent[msg.sender]+= msgFee;
            frontendCycleFeePercent[feeReceiver]+= msgFee;
        }

        super.send(to, payload);
        cycleAccruedFees[currentCycle] += msg.value;
        uint256 gasUsed = startGas - gasleft();
        
        require(
            msg.value >=
                ((gasUsed+ 21000 + 50000) * tx.gasprice  * MAIL_FEE) / 10000,
            "Deb0x: must pay 10% of transaction cost"
        );
    }

    function claimRewards() public setUpNewCycle notify(msg.sender) {
        uint256 currentCycle = getCurrentCycle();
        uint256 reward = addressRewards[msg.sender] - userWithdrawableStake[msg.sender];
        require(reward > 0, "Deb0x: You do not have rewards");
        addressRewards[msg.sender] -= reward;
        summedCycleStakes[currentCycle] = summedCycleStakes[currentCycle] - reward;
        dbx.mintReward(msg.sender, reward);
    }

    function claimFrontEndRewards() public {
        uint256 currentCycle = getCurrentCycle();
        updateFrontEndStats(msg.sender, currentCycle);

        uint256 reward = frontendRewards[msg.sender];
        require(reward > 0, "Deb0x: You do not have rewards");
        frontendRewards[msg.sender] = 0;
        dbx.mintReward(msg.sender, reward);
    }
    
    function claimFrontEndFees() public {
        uint256 currentCycle = getCurrentCycle();
        updateFrontEndStats(msg.sender, currentCycle);
        uint256 fees = frontEndAccruedFees[msg.sender];
        require(fees > 0, "Deb0x: You do not have accrued fees");
        frontEndAccruedFees[msg.sender] = 0;
        sendViaCall(payable(msg.sender), fees);
        emit FeesClaimed(fees);
    }

    function claimFees() public setUpNewCycle notify(msg.sender){
        uint256 fees = addressAccruedFees[msg.sender];
        require(fees > 0, "Deb0x: You do not have accrued fees");
        addressAccruedFees[msg.sender] = 0;
        sendViaCall(payable(msg.sender), fees);
        emit FeesClaimed(fees);
    }

    function stakeDBX(uint256 _amount)
        external
        setUpNewCycle
        notify(msg.sender)
    {
        require(_amount != 0, "Deb0x: your amount is 0");
        uint256 currentCycle = getCurrentCycle();
        pendingStake += _amount;

        if(userFirstStake[msg.sender] == 0) {
            userFirstStake[msg.sender] = currentCycle;
            
        } else if(userSecondStake[msg.sender] == 0) {
            userSecondStake[msg.sender] = currentCycle;
        }
        userStakeCycle[msg.sender][currentCycle + 1] += _amount;

        dbx.transferFrom(msg.sender, address(this), _amount);
    }

    function unstake(uint256 _amount) 
        external
        setUpNewCycle
        notify(msg.sender)
    {
        require(_amount != 0, "Deb0x: your amount is 0");
        require(_amount <= userWithdrawableStake[msg.sender], "Deb0x: can not unstake more than you've staked");

        uint256 currentCycle = getCurrentCycle();

        userWithdrawableStake[msg.sender] -= _amount;
        addressRewards[msg.sender] -= _amount;
        summedCycleStakes[currentCycle] -= _amount;

        dbx.transfer(msg.sender, _amount);
    }

    function sendViaCall(address payable _to, uint256 _amount) private {
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Deb0x: failed to send amount");
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getCurrentCycle() public view returns(uint256){
        return (block.timestamp - i_initialTimestamp) / i_periodDuration ;
    }

    function calculateCycleReward() public view returns(uint256){
        return lastCycleReward * 10000 / 10019;
    }

    function getUserWithdrawableStake(address staker) public view returns(uint256) {
        uint256 currentCycle = getCurrentCycle();
        uint256 unlockedStake = 0;
        if(userFirstStake[staker] != 0 && currentCycle - userFirstStake[staker] > 1) {
            unlockedStake += userStakeCycle[staker][userFirstStake[staker] + 1];

            if(userSecondStake[staker] != 0 && currentCycle - userSecondStake[staker] > 1) {
                unlockedStake += userStakeCycle[staker][userSecondStake[staker] + 1];
            }
        }
        return userWithdrawableStake[staker] + unlockedStake;
    }
}