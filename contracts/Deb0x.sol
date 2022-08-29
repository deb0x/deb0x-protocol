// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./Deb0xERC20.sol";
import "./Deb0xGovernor.sol";
import "./Deb0xCore.sol";

contract Deb0x is Ownable, Deb0xCore {
    //Message setup
    Deb0xERC20 public deboxERC20;
    Deb0xGovernor public governor;
    uint16 public fee = 1000;

    //Tokenomic setup
    uint256 public rewardRate = 100;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public balanceERC20;

    mapping(address => uint256) public userRewardPerTokenPaid;

    event FeesClaimed(uint256 fees);

    constructor() {
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
        uint256 currentCycle = getCurrentCycle();
        cycleAccruedFees[currentCycle] += fee;
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
            uint256 lastUpdatedCycle = frontEndLastRewardUpdate[frontend];
            if(frontendCycleFeePercent[frontend] != 0 && cycleTotalMessages[lastUpdatedCycle] != 0) {
                uint256 rewardPerMsg = rewardPerCycle[lastUpdatedCycle] / cycleTotalMessages[lastUpdatedCycle];
                frontendRewards[frontend] += rewardPerMsg * frontendCycleFeePercent[frontend] / 10000;
                frontendCycleFeePercent[frontend] = 0;
            }
            frontEndLastRewardUpdate[frontend] = currentCycle;
        }
        if(currentCycle > frontEndLastFeeUpdate[frontend]) {
            console.log(cycleFeesPerStakeSummed[currentCycle], cycleFeesPerStakeSummed[frontEndLastFeeUpdate[frontend]]);
            frontEndAccruedFees[frontend] += (frontendRewards[frontend] 
                * (cycleFeesPerStakeSummed[currentCycle] - cycleFeesPerStakeSummed[frontEndLastFeeUpdate[frontend]])) / 1e18;
            frontEndLastFeeUpdate[frontend] = currentCycle;
        }
    }

    function send(address[] memory to, string[] memory payload, address feeReceiver, uint256 msgFee, uint256 nativeTokenFee)
        public
        payable
        gasWrapper(nativeTokenFee)
        setUpNewCycle
        notify(msg.sender)
    {
        uint256 currentCycle = getCurrentCycle();

        updateFrontEndStats(feeReceiver, currentCycle);

        userCycleMessages[msg.sender]++;
        cycleTotalMessages[currentCycle]++;
        lastActiveCycle[msg.sender] = currentCycle;

        if(feeReceiver != address(0)) {
            if(msgFee != 0) {
                userCycleFeePercent[msg.sender]+= msgFee;
                frontendCycleFeePercent[feeReceiver]+= msgFee;
            }
            if(nativeTokenFee != 0) {
                frontEndAccruedFees[feeReceiver] += nativeTokenFee;
            }
        }

        super.send(to, payload);
    }

    function claimRewards() public setUpNewCycle notify(msg.sender) {
        uint256 currentCycle = getCurrentCycle();
        uint256 reward = addressRewards[msg.sender] - userWithdrawableStake[msg.sender];
        require(reward > 0, "Deb0x: You do not have rewards");
        addressRewards[msg.sender] -= reward;
        summedCycleStakes[currentCycle] = summedCycleStakes[currentCycle] - reward;
        dbx.mintReward(msg.sender, reward);
    }

    function claimFrontEndRewards() public setUpNewCycle {
        uint256 currentCycle = getCurrentCycle();
        updateFrontEndStats(msg.sender, currentCycle);

        uint256 reward = frontendRewards[msg.sender];
        require(reward > 0, "Deb0x: You do not have rewards");
        frontendRewards[msg.sender] = 0;
        dbx.mintReward(msg.sender, reward);
    }
    
    function claimFrontEndFees() public setUpNewCycle {
        uint256 currentCycle = getCurrentCycle();
        updateFrontEndStats(msg.sender, currentCycle);
        uint256 fees = frontEndAccruedFees[msg.sender];
        require(fees > 0, "Deb0x: You do not have accrued fees");
        frontEndAccruedFees[msg.sender] = 0;
        sendViaCall(payable(msg.sender), fees);
        emit FeesClaimed(fees);
    }

        rewards[account] = earnedNative(account);
        userRewardPerTokenPaid[account] = rewardPerTokenStored;
        _;
    }

    function stakeERC20(uint256 _amount)
        external
        payable
        updateReward(msg.sender)
    {
        require(_amount != 0, "Deb0x: your amount is 0");

        totalSupply += _amount;
        balanceERC20[msg.sender] += _amount;

        deboxERC20.transferFrom(msg.sender, address(this), _amount);
    }

    function unStakeERC20(uint256 _amount) external updateReward(msg.sender) {
        require(_amount != 0, "Deb0x: your amount is 0");
        require(
            balanceERC20[msg.sender] - _amount >= 0,
            "Deb0x: insufficient balance"
        );

        totalSupply -= _amount;
        balanceERC20[msg.sender] -= _amount;
        deboxERC20.transferFrom(address(this), msg.sender, _amount);
    }

    function getRewardNative() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "Deb0x: your reward balance is 0");

        rewards[msg.sender] = 0;

        sendViaCall(payable(msg.sender), reward);
    }

    function sendViaCall(address payable _to, uint256 _amount) private {
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Deb0x: failed to send amount");
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }

        return
            rewardPerTokenStored +
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) /
                totalSupply);
    }

    function earnedNative(address account) public view returns (uint256) {
        return
            ((balanceERC20[account] *
                (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) +
            rewards[account];
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}