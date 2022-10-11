// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./Deb0xCore.sol";
import "./DBX.sol";
import "hardhat/console.sol";

contract Deb0x is Deb0xCore {
    //Message setup

    DBX public dbx;
    uint16 public constant MAIL_FEE = 1000;
    uint256 public constant dividend = 1e18;
    uint256 immutable i_initialTimestamp;
    uint256 immutable i_periodDuration;
    uint256 currentCycleReward;
    uint256 lastCycleReward;
    uint256 pendingStake;
    uint256 currentCycle;
    uint256 lastStartedCycle;
    uint256 previousStartedCycle;
    uint256 public currentStartedCycle;
    uint256 pendingCycleRewardsStake;
    uint256 public pendingStakeWithdrawal;

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
    mapping(uint256 => uint256) public cycleAccruedFees;
    mapping(uint256 => uint256) public cycleFeesPerStake;
    mapping(uint256 => uint256) public cycleFeesPerStakeSummed;
    mapping(address => mapping(uint256 => uint256)) userStakeCycle;
    mapping(address => uint256) public userWithdrawableStake;
    mapping(address => uint256) userFirstStake;
    mapping(address => uint256) userSecondStake;

    event FeesClaimed(uint256 fees);

    constructor(address forwarder)
    Deb0xCore(forwarder) {
        dbx = new DBX();
        i_initialTimestamp = block.timestamp;
        i_periodDuration = 1 days;
        currentCycleReward = 100 * 1e18;
        summedCycleStakes[0] = 100 * 1e18;
        rewardPerCycle[0] = 100 * 1e18;
    }

    modifier gasWrapper(uint256 nativeTokenFee) {
        uint256 startGas = gasleft();
        _;
        uint256 fee = ((startGas - gasleft() + 31108) * tx.gasprice  * MAIL_FEE) / 10000;
        require(msg.value - nativeTokenFee >= fee, "Deb0x: must pay 10% of transaction cost");
        sendViaCall(payable(msg.sender), msg.value - fee - nativeTokenFee);
        cycleAccruedFees[currentCycle] += fee;
    }

    modifier calculateCycle() {
        uint256 calculatedCycle = getCurrentCycle();
        if(calculatedCycle > currentCycle) {
            currentCycle = calculatedCycle;
        }
        _;
    }

    modifier updateCycleFeesPerStakeSummed() {
        if(currentCycle != currentStartedCycle) {
            previousStartedCycle = lastStartedCycle + 1;
            lastStartedCycle = currentStartedCycle;
        }
        if(currentCycle > lastStartedCycle && cycleFeesPerStakeSummed[lastStartedCycle + 1] == 0) {
            // console.log(lastStartedCycle);
            uint256 feePerStake = cycleAccruedFees[lastStartedCycle] * dividend / summedCycleStakes[lastStartedCycle];
            // console.log(cycleFeesPerStakeSummed[previousStartedCycle], feePerStake);
            cycleFeesPerStakeSummed[lastStartedCycle + 1] = cycleFeesPerStakeSummed[previousStartedCycle] + feePerStake;
        }
        _;
    }
    
    modifier setUpNewCycle() {
        if(rewardPerCycle[currentCycle] == 0) {
            lastCycleReward = currentCycleReward;
            uint256 calculatedCycleReward = calculateCycleReward();
            currentCycleReward = calculatedCycleReward;
            rewardPerCycle[currentCycle] = calculatedCycleReward;
            pendingCycleRewardsStake = calculatedCycleReward;
            //lastStartedCycle = currentStartedCycle;
            currentStartedCycle = currentCycle;
            summedCycleStakes[currentStartedCycle] += summedCycleStakes[lastStartedCycle] + currentCycleReward;
            if(pendingStake != 0) {
                summedCycleStakes[currentStartedCycle] += pendingStake;
                pendingStake = 0;
            }
            if(pendingStakeWithdrawal != 0) {
                summedCycleStakes[currentStartedCycle] -= pendingStakeWithdrawal;
                pendingStakeWithdrawal = 0;
            }
        }
        _;
    }

    // modifier updateStakeStats() {
        
    //     if(summedCycleStakes[currentStartedCycle] == 0) {
    //         summedCycleStakes[currentStartedCycle] += summedCycleStakes[lastStartedCycle];
    //         if(pendingStake != 0) {
    //             summedCycleStakes[currentStartedCycle] += pendingStake;
    //             pendingStake = 0;
    //         }
    //     }
    //     _;
    // }

    modifier notify(address account) {
        if(currentCycle > lastActiveCycle[account] && userCycleMessages[account] != 0) {
            uint256 lastCycleUserReward = userCycleMessages[account] * rewardPerCycle[lastActiveCycle[account]] / cycleTotalMessages[lastActiveCycle[account]];
            addressRewards[account] += lastCycleUserReward;
            if(userCycleFeePercent[account] != 0) {
                uint256 rewardPerMsg = lastCycleUserReward / userCycleMessages[account];
                uint256 rewardsOwed = rewardPerMsg * userCycleFeePercent[account] / 10000;
                addressRewards[account] -= rewardsOwed;
                userCycleFeePercent[account] = 0;
            }
            userCycleMessages[account] = 0;
            
        }
        
        if(currentCycle > lastStartedCycle && lastFeeUpdateCycle[account] != lastStartedCycle + 1){
            // console.log(lastStartedCycle + 1, lastFeeUpdateCycle[account]);
            // console.log(cycleFeesPerStakeSummed[lastStartedCycle + 1], cycleFeesPerStakeSummed[lastFeeUpdateCycle[account]]);
            addressAccruedFees[account] = addressAccruedFees[account] + ((addressRewards[account] 
                * (cycleFeesPerStakeSummed[lastStartedCycle + 1] - cycleFeesPerStakeSummed[lastFeeUpdateCycle[account]]))) / dividend;
            lastFeeUpdateCycle[account] = lastStartedCycle + 1;
        }
        
        if(userFirstStake[account] != 0 && currentCycle - userFirstStake[account] > 0) {
            uint256 unlockedFirstStake = userStakeCycle[account][userFirstStake[account]];
            addressRewards[account] += unlockedFirstStake;
            userWithdrawableStake[account] += unlockedFirstStake;
            addressAccruedFees[account] = addressAccruedFees[account] + 
                ((userStakeCycle[account][userFirstStake[account]] 
                * (cycleFeesPerStakeSummed[lastStartedCycle + 1] - cycleFeesPerStakeSummed[userFirstStake[account]]))) / dividend;
            userStakeCycle[account][userFirstStake[account]] = 0;
            userFirstStake[account] = 0;

            if(userSecondStake[account] != 0) {
                if(currentCycle - userSecondStake[account] > 1) {
                        uint256 unlockedSecondStake = userStakeCycle[account][userSecondStake[account]];
                        addressRewards[account] += unlockedSecondStake;
                        userWithdrawableStake[account] += unlockedSecondStake;
                        addressAccruedFees[account] = addressAccruedFees[account] + 
                            ((userStakeCycle[account][userSecondStake[account]] 
                            * (cycleFeesPerStakeSummed[lastStartedCycle + 1] - cycleFeesPerStakeSummed[userSecondStake[account]]))) / dividend;
                        userStakeCycle[account][userSecondStake[account]] = 0;
                        userSecondStake[account] = 0;
                        } else {
                            userFirstStake[account] = userSecondStake[account];
                            userSecondStake[account] = 0;
                        }
                    }
        }
        _;
    }

    function updateFrontEndStats(address frontend) internal {
        if(currentCycle > frontEndLastRewardUpdate[frontend]) {
            uint256 lastUpdatedCycle = frontEndLastRewardUpdate[frontend];
            if(frontendCycleFeePercent[frontend] != 0 && cycleTotalMessages[lastUpdatedCycle] != 0) {
                uint256 rewardPerMsg = rewardPerCycle[lastUpdatedCycle] / cycleTotalMessages[lastUpdatedCycle];
                frontendRewards[frontend] += rewardPerMsg * frontendCycleFeePercent[frontend] / 10000;
                frontendCycleFeePercent[frontend] = 0;
            }
            frontEndLastRewardUpdate[frontend] = currentCycle;
        }
        if(currentCycle > lastStartedCycle && frontEndLastFeeUpdate[frontend] != lastStartedCycle + 1) {
            frontEndAccruedFees[frontend] += (frontendRewards[frontend] 
                * (cycleFeesPerStakeSummed[lastStartedCycle + 1] - cycleFeesPerStakeSummed[frontEndLastFeeUpdate[frontend]])) / dividend;
            frontEndLastFeeUpdate[frontend] = lastStartedCycle + 1;
        }
    }

    function send(address[] memory to, string[] memory payload, address feeReceiver, uint256 msgFee, uint256 nativeTokenFee)
        public
        payable
        gasWrapper(nativeTokenFee)
        calculateCycle
        updateCycleFeesPerStakeSummed
        setUpNewCycle
        notify(_msgSender())
    {
        updateFrontEndStats(feeReceiver);

        userCycleMessages[_msgSender()]++;
        cycleTotalMessages[currentCycle]++;
        lastActiveCycle[_msgSender()] = currentCycle;

        if(feeReceiver != address(0)) {
            if(msgFee != 0) {
                userCycleFeePercent[_msgSender()]+= msgFee;
                frontendCycleFeePercent[feeReceiver]+= msgFee;
            }
            if(nativeTokenFee != 0) {
                frontEndAccruedFees[feeReceiver] += nativeTokenFee;
            }
        }

        super.send(to, payload);
        //cycleAccruedFees[currentCycle] += msg.value;
    }

    function claimRewards() public calculateCycle updateCycleFeesPerStakeSummed  notify(_msgSender()) {
        uint256 reward = addressRewards[_msgSender()] - userWithdrawableStake[_msgSender()];
        require(reward > 0, "Deb0x: You do not have rewards");
        addressRewards[_msgSender()] -= reward;
        if(lastStartedCycle == currentStartedCycle){
            pendingStakeWithdrawal += reward;
        } else {
            summedCycleStakes[currentCycle] = summedCycleStakes[currentCycle] - reward;
        }
        
        
        dbx.mintReward(_msgSender(), reward);
    }

    function claimFrontEndRewards() public calculateCycle updateCycleFeesPerStakeSummed  {
        updateFrontEndStats(_msgSender());

        uint256 reward = frontendRewards[_msgSender()];
        require(reward > 0, "Deb0x: You do not have rewards");
        frontendRewards[_msgSender()] = 0;
        if(lastStartedCycle == currentStartedCycle){
            pendingStakeWithdrawal += reward;
        } else {
            summedCycleStakes[currentCycle] = summedCycleStakes[currentCycle] - reward;
        }
        dbx.mintReward(_msgSender(), reward);
    }
    
    function claimFrontEndFees() public calculateCycle updateCycleFeesPerStakeSummed {
        updateFrontEndStats(_msgSender());
        uint256 fees = frontEndAccruedFees[_msgSender()];
        require(fees > 0, "Deb0x: You do not have accrued fees");
        frontEndAccruedFees[_msgSender()] = 0;
        sendViaCall(payable(_msgSender()), fees);
        emit FeesClaimed(fees);
    }

    function claimFees() public calculateCycle updateCycleFeesPerStakeSummed notify(_msgSender()){
        uint256 fees = addressAccruedFees[_msgSender()];
        require(fees > 0, "Deb0x: You do not have accrued fees");
        addressAccruedFees[_msgSender()] = 0;
        sendViaCall(payable(_msgSender()), fees);
        emit FeesClaimed(fees);
    }

    function stakeDBX(uint256 _amount)
        external
        calculateCycle
        updateCycleFeesPerStakeSummed
        notify(_msgSender())
    {
        require(_amount != 0, "Deb0x: your amount is 0");
        pendingStake += _amount;
        uint256 cycleToSet = currentCycle + 1;

        if(lastStartedCycle == currentStartedCycle) {
            cycleToSet = currentCycle;
        }

        if(currentCycle != userFirstStake[_msgSender()] &&
            currentCycle != userSecondStake[_msgSender()]) {
                if(userFirstStake[_msgSender()] == 0) {
                    userFirstStake[_msgSender()] = cycleToSet;
            
                } else if(userSecondStake[_msgSender()] == 0) {
                    userSecondStake[_msgSender()] = cycleToSet;
                }
            }
        userStakeCycle[_msgSender()][cycleToSet] += _amount;

        dbx.transferFrom(_msgSender(), address(this), _amount);
    }

    function unstake(uint256 _amount) 
        external
        calculateCycle
        updateCycleFeesPerStakeSummed
        notify(_msgSender())
    {
        require(_amount != 0, "Deb0x: your amount is 0");
        require(_amount <= userWithdrawableStake[_msgSender()], "Deb0x: can not unstake more than you've staked");

        if(lastStartedCycle == currentStartedCycle){
            pendingStakeWithdrawal += _amount;
        } else {
            summedCycleStakes[currentCycle] -= _amount;
        }
        userWithdrawableStake[_msgSender()] -= _amount;
        addressRewards[_msgSender()] -= _amount;
    
        dbx.transfer(_msgSender(), _amount);
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
        uint256 calculatedCycle = getCurrentCycle();
        uint256 unlockedStake = 0;
        if(userFirstStake[staker] != 0 && calculatedCycle - userFirstStake[staker] > 1) {
            unlockedStake += userStakeCycle[staker][userFirstStake[staker]];

            if(userSecondStake[staker] != 0 && calculatedCycle - userSecondStake[staker] > 1) {
                unlockedStake += userStakeCycle[staker][userSecondStake[staker]];
            }
        }
        return userWithdrawableStake[staker] + unlockedStake;
    }

    function getUnclaimedRewards(address user) public view returns(uint256) {
        uint256 currentRewards = addressRewards[user];
        uint256 calculatedCycle = getCurrentCycle();

        if(calculatedCycle > lastActiveCycle[user] && userCycleMessages[user] != 0) {
                uint256 lastCycleUserReward = userCycleMessages[user] * rewardPerCycle[lastActiveCycle[user]] / cycleTotalMessages[lastActiveCycle[user]];
                currentRewards += lastCycleUserReward;

                if(userCycleFeePercent[user] != 0) {
                uint256 rewardPerMsg = lastCycleUserReward / userCycleMessages[user];
                uint256 rewardsOwed = rewardPerMsg * userCycleFeePercent[user] / 10000;
                currentRewards -= rewardsOwed;
                }
            }
        return currentRewards;
    }

    function getUnclaimedFees(address user) public view returns(uint256){
        uint256 calculatedCycle = getCurrentCycle();
        uint256 currentAccruedFees = addressAccruedFees[user];
        uint256 currentCycleFeesPerStakeSummed;
        uint256 previousStartedCycleTemp = previousStartedCycle;
        uint256 lastStartedCycleTemp = lastStartedCycle;

        if(calculatedCycle != currentStartedCycle) {
            previousStartedCycleTemp = lastStartedCycle + 1;
            lastStartedCycleTemp = currentStartedCycle;
        }

        if(calculatedCycle > lastStartedCycleTemp && cycleFeesPerStakeSummed[lastStartedCycleTemp + 1] == 0) {
            uint256 feePerStake = cycleAccruedFees[lastStartedCycleTemp] * dividend / summedCycleStakes[lastStartedCycleTemp];
            currentCycleFeesPerStakeSummed = cycleFeesPerStakeSummed[previousStartedCycle] + feePerStake;
        } else {
            currentCycleFeesPerStakeSummed = cycleFeesPerStakeSummed[previousStartedCycle];
        }

        uint256 currentRewards = getUnclaimedRewards(user);
        if(calculatedCycle > lastStartedCycleTemp && lastFeeUpdateCycle[user] != lastStartedCycleTemp + 1){
            currentAccruedFees += ((currentRewards
                * (currentCycleFeesPerStakeSummed - cycleFeesPerStakeSummed[lastFeeUpdateCycle[user]]))) / dividend;
        }

        if(userFirstStake[user] != 0 && calculatedCycle - userFirstStake[user] > 1) {
            currentAccruedFees += 
                ((userStakeCycle[user][userFirstStake[user]] 
                * (currentCycleFeesPerStakeSummed - cycleFeesPerStakeSummed[userFirstStake[user]]))) / dividend;

            if(userSecondStake[user] != 0 && calculatedCycle - userSecondStake[user] > 1) {
                currentAccruedFees += 
                    ((userStakeCycle[user][userSecondStake[user]] 
                    * (currentCycleFeesPerStakeSummed - cycleFeesPerStakeSummed[userSecondStake[user]]))) / dividend;                    
            }
        }
        return currentAccruedFees;
    }
}