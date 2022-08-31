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
    uint256 currentStartedCycle;
    uint256 pendingCycleRewardsStake;
    uint256 pendingStakeWithdrawal;

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
        uint256 fee = ((startGas - gasleft() + 31108) *
            tx.gasprice *
            MAIL_FEE) / 10000;
        require(
            msg.value - nativeTokenFee >= fee,
            "Deb0x: must pay 10% of transaction cost"
        );
        sendViaCall(payable(msg.sender), msg.value - fee - nativeTokenFee);
        cycleAccruedFees[currentCycle] += fee;
    }

    modifier calculateCycle() {
        uint256 calculatedCycle = getCurrentCycle();
        if (calculatedCycle > currentCycle) {
            currentCycle = calculatedCycle;
        }
        _;
    }

    modifier updateCycleFeesPerStakeSummed() {
        if (currentCycle != currentStartedCycle) {
            lastStartedCycle = currentStartedCycle;
        }
        if (
            currentCycle > lastStartedCycle &&
            cycleFeesPerStakeSummed[lastStartedCycle + 1] == 0
        ) {
            console.log("lastStartedCycle: ", lastStartedCycle);
            uint256 feePerStake = (cycleAccruedFees[lastStartedCycle] *
                dividend) / summedCycleStakes[lastStartedCycle];
            cycleFeesPerStakeSummed[lastStartedCycle + 1] =
                cycleFeesPerStakeSummed[lastStartedCycle] +
                feePerStake;
            console.log(
                "cycleFeesPerStakeSummed[currentCycle]: ",
                cycleFeesPerStakeSummed[currentCycle]
            );
        }
        _;
    }

    modifier setUpNewCycle() {
        if (rewardPerCycle[currentCycle] == 0) {
            lastCycleReward = currentCycleReward;
            uint256 calculatedCycleReward = calculateCycleReward();
            currentCycleReward = calculatedCycleReward;
            rewardPerCycle[currentCycle] = calculatedCycleReward;
            pendingCycleRewardsStake = calculatedCycleReward;
            //lastStartedCycle = currentStartedCycle;
            currentStartedCycle = currentCycle;
            summedCycleStakes[currentStartedCycle] +=
                summedCycleStakes[lastStartedCycle] +
                currentCycleReward;
            if (pendingStake != 0) {
                summedCycleStakes[currentStartedCycle] += pendingStake;
                pendingStake = 0;
            }
            if (pendingStakeWithdrawal != 0) {
                summedCycleStakes[
                    currentStartedCycle
                ] -= pendingStakeWithdrawal;
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
        if (
            currentCycle > lastActiveCycle[account] &&
            userCycleMessages[account] != 0
        ) {
            uint256 lastCycleUserReward = (userCycleMessages[account] *
                rewardPerCycle[lastActiveCycle[account]]) /
                cycleTotalMessages[lastActiveCycle[account]];
            addressRewards[account] += lastCycleUserReward;
            if (userCycleFeePercent[account] != 0) {
                uint256 rewardPerMsg = lastCycleUserReward /
                    userCycleMessages[account];
                uint256 rewardsOwed = (rewardPerMsg *
                    userCycleFeePercent[account]) / 10000;
                addressRewards[account] -= rewardsOwed;
                userCycleFeePercent[account] = 0;
            }
            userCycleMessages[account] = 0;
        }

        if (
            currentCycle > lastStartedCycle &&
            lastFeeUpdateCycle[account] != lastStartedCycle + 1
        ) {
            addressAccruedFees[account] =
                addressAccruedFees[account] +
                (
                    (addressRewards[account] *
                        (cycleFeesPerStakeSummed[lastStartedCycle + 1] -
                            cycleFeesPerStakeSummed[
                                lastFeeUpdateCycle[account]
                            ]))
                ) /
                dividend;
            lastFeeUpdateCycle[account] = lastStartedCycle + 1;
        }

        if (
            userFirstStake[account] != 0 &&
            currentCycle - userFirstStake[account] > 1
        ) {
            uint256 unlockedFirstStake = userStakeCycle[account][
                userFirstStake[account] + 1
            ];
            addressRewards[account] += unlockedFirstStake;
            userWithdrawableStake[account] += unlockedFirstStake;
            console.log(
                "stake unlocked fees: ",
                (userStakeCycle[account][userFirstStake[account] + 1] *
                    (cycleFeesPerStakeSummed[currentCycle] -
                        cycleFeesPerStakeSummed[userFirstStake[account] + 1])) /
                    dividend
            );
            addressAccruedFees[account] =
                addressAccruedFees[account] +
                (
                    (userStakeCycle[account][userFirstStake[account] + 1] *
                        (cycleFeesPerStakeSummed[currentCycle] -
                            cycleFeesPerStakeSummed[
                                userFirstStake[account] + 1
                            ]))
                ) /
                dividend;
            userStakeCycle[account][userFirstStake[account] + 1] = 0;
            userFirstStake[account] = 0;

            if (userSecondStake[account] != 0) {
                if (currentCycle - userSecondStake[account] > 1) {
                    uint256 unlockedSecondStake = userStakeCycle[account][
                        userSecondStake[account] + 1
                    ];
                    addressRewards[account] += unlockedSecondStake;
                    userWithdrawableStake[account] += unlockedSecondStake;
                    addressAccruedFees[account] =
                        addressAccruedFees[account] +
                        (
                            (userStakeCycle[account][
                                userSecondStake[account] + 1
                            ] *
                                (cycleFeesPerStakeSummed[currentCycle] -
                                    cycleFeesPerStakeSummed[
                                        userSecondStake[account] + 1
                                    ]))
                        ) /
                        dividend;
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

    function updateFrontEndStats(address frontend) internal {
        if (currentCycle > frontEndLastRewardUpdate[frontend]) {
            if (frontendCycleFeePercent[frontend] != 0) {
                uint256 lastUpdatedCycle = frontEndLastRewardUpdate[frontend];
                uint256 rewardPerMsg = rewardPerCycle[lastUpdatedCycle] /
                    cycleTotalMessages[lastUpdatedCycle];
                frontendRewards[frontend] +=
                    (rewardPerMsg * frontendCycleFeePercent[frontend]) /
                    10000;
                frontendCycleFeePercent[frontend] = 0;
            }
            frontEndLastRewardUpdate[frontend] = currentCycle;
        }
        if (currentCycle > frontEndLastFeeUpdate[frontend]) {
            frontEndAccruedFees[frontend] +=
                (frontendRewards[frontend] *
                    (cycleFeesPerStakeSummed[currentCycle] -
                        cycleFeesPerStakeSummed[
                            frontEndLastFeeUpdate[frontend]
                        ])) /
                1e18;
            frontEndLastFeeUpdate[frontend] = currentCycle;
        }
    }

    function send(
        address[] memory to,
        string[] memory payload,
        address feeReceiver,
        uint256 msgFee,
        uint256 nativeTokenFee
    )
        public
        payable
        gasWrapper(nativeTokenFee)
        calculateCycle
        updateCycleFeesPerStakeSummed
        setUpNewCycle
        notify(msg.sender)
    {
        updateFrontEndStats(feeReceiver);

        userCycleMessages[msg.sender]++;
        cycleTotalMessages[currentCycle]++;
        lastActiveCycle[msg.sender] = currentCycle;

        if (feeReceiver != address(0)) {
            if (msgFee != 0) {
                userCycleFeePercent[msg.sender] += msgFee;
                frontendCycleFeePercent[feeReceiver] += msgFee;
            }
            if (nativeTokenFee != 0) {
                frontEndAccruedFees[feeReceiver] += nativeTokenFee;
            }
        }

        super.send(to, payload);
        //cycleAccruedFees[currentCycle] += msg.value;
    }

    function claimRewards()
        public
        calculateCycle
        updateCycleFeesPerStakeSummed
        notify(msg.sender)
    {
        uint256 reward = addressRewards[msg.sender] -
            userWithdrawableStake[msg.sender];
        require(reward > 0, "Deb0x: You do not have rewards");
        addressRewards[msg.sender] -= reward;
        console.log(
            "summedCycleStakes[currentCycle]: ",
            summedCycleStakes[currentCycle],
            " reward: ",
            reward
        );
        if (lastStartedCycle == currentStartedCycle) {
            pendingStakeWithdrawal += reward;
        } else {
            summedCycleStakes[currentCycle] =
                summedCycleStakes[currentCycle] -
                reward;
        }

        dbx.mintReward(msg.sender, reward);
    }

    function claimFrontEndRewards()
        public
        calculateCycle
        updateCycleFeesPerStakeSummed
    {
        updateFrontEndStats(msg.sender);

        uint256 reward = frontendRewards[msg.sender];
        require(reward > 0, "Deb0x: You do not have rewards");
        frontendRewards[msg.sender] = 0;
        summedCycleStakes[currentCycle] =
            summedCycleStakes[currentCycle] -
            reward;
        dbx.mintReward(msg.sender, reward);
    }

    function claimFrontEndFees()
        public
        calculateCycle
        updateCycleFeesPerStakeSummed
    {
        updateFrontEndStats(msg.sender);
        uint256 fees = frontEndAccruedFees[msg.sender];
        require(fees > 0, "Deb0x: You do not have accrued fees");
        frontEndAccruedFees[msg.sender] = 0;
        sendViaCall(payable(msg.sender), fees);
        emit FeesClaimed(fees);
    }

    function claimFees()
        public
        calculateCycle
        updateCycleFeesPerStakeSummed
        notify(msg.sender)
    {
        uint256 fees = addressAccruedFees[msg.sender];
        require(fees > 0, "Deb0x: You do not have accrued fees");
        addressAccruedFees[msg.sender] = 0;
        sendViaCall(payable(msg.sender), fees);
        emit FeesClaimed(fees);
    }

    function stakeDBX(uint256 _amount)
        external
        calculateCycle
        updateCycleFeesPerStakeSummed
        notify(msg.sender)
    {
        require(_amount != 0, "Deb0x: your amount is 0");
        pendingStake += _amount;

        if (userFirstStake[msg.sender] == 0) {
            userFirstStake[msg.sender] = currentCycle;
        } else if (userSecondStake[msg.sender] == 0) {
            userSecondStake[msg.sender] = currentCycle;
        }
        userStakeCycle[msg.sender][currentCycle + 1] += _amount;

        dbx.transferFrom(msg.sender, address(this), _amount);
    }

    function unstake(uint256 _amount)
        external
        calculateCycle
        updateCycleFeesPerStakeSummed
        notify(msg.sender)
    {
        require(_amount != 0, "Deb0x: your amount is 0");
        require(
            _amount <= userWithdrawableStake[msg.sender],
            "Deb0x: can not unstake more than you've staked"
        );

        if (lastStartedCycle == currentStartedCycle) {
            pendingStakeWithdrawal += _amount;
        } else {
            summedCycleStakes[currentCycle] -= _amount;
        }
        userWithdrawableStake[msg.sender] -= _amount;
        addressRewards[msg.sender] -= _amount;

        dbx.transfer(msg.sender, _amount);
    }

    function sendViaCall(address payable _to, uint256 _amount) private {
        console.log(address(this).balance, _amount);
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Deb0x: failed to send amount");
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getCurrentCycle() public view returns (uint256) {
        return (block.timestamp - i_initialTimestamp) / i_periodDuration;
    }

    function calculateCycleReward() public view returns (uint256) {
        return (lastCycleReward * 10000) / 10019;
    }

    function getUserWithdrawableStake(address staker)
        public
        view
        returns (uint256)
    {
        uint256 calculatedCycle = getCurrentCycle();
        uint256 unlockedStake = 0;
        if (
            userFirstStake[staker] != 0 &&
            calculatedCycle - userFirstStake[staker] > 1
        ) {
            unlockedStake += userStakeCycle[staker][userFirstStake[staker] + 1];

            if (
                userSecondStake[staker] != 0 &&
                calculatedCycle - userSecondStake[staker] > 1
            ) {
                unlockedStake += userStakeCycle[staker][
                    userSecondStake[staker] + 1
                ];
            }
        }
        return userWithdrawableStake[staker] + unlockedStake;
    }
}
