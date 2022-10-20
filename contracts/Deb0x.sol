// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "./DBX.sol";

contract Deb0x is ERC2771Context {
    struct Envelope {
        string content;
        uint256 timestamp;
    }

    DBX public dbx;
    uint16 public constant PROTOCOL_FEE = 1000;
    uint256 public constant scalingFactor = 1e18;
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
    uint256 public sentId = 1;

    mapping(address => string) public publicKeys;
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
    mapping(address => bool) stakedDuringGapCycle;

    event FrontEndFeesClaimed(
        uint256 indexed cycle,
        address indexed userAddress,
        uint256 fees
    );
    event FeesClaimed(
        uint256 indexed cycle,
        address indexed userAddress,
        uint256 fees
    );
    event Staked(
        uint256 indexed cycle,
        address indexed userAddress,
        uint256 amount
    );
    event Unstaked(
        uint256 indexed cycle,
        address indexed userAddress,
        uint256 amount
    );
    event FrontEndRewardsClaimed(
        uint256 indexed cycle,
        address indexed userAddress,
        uint256 amount
    );
    event RewardsClaimed(
        uint256 indexed cycle,
        address indexed userAddress,
        uint256 reward
    );
    event NewCycleStarted(
        uint256 indexed cycle,
        uint256 calculatedCycleReward,
        uint256 summedCycleStakes
    );
    event SendEntryCreated(
        uint256 indexed cycle,
        uint256 indexed sentId,
        address indexed feeReceiver,
        uint256 msgFee,
        uint256 nativeTokenFee
    );
    event Sent(
        address indexed to,
        address indexed from,
        bytes32 indexed hash,
        Envelope body,
        uint256 sentId
    );
    event KeySet(address indexed to, bytes32 indexed hash, string value);

    modifier gasWrapper(uint256 nativeTokenFee) {
        uint256 startGas = gasleft();
        _;
        uint256 fee = ((startGas - gasleft() + 31108) *
            tx.gasprice *
            PROTOCOL_FEE) / 10000;
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
            previousStartedCycle = lastStartedCycle + 1;
            lastStartedCycle = currentStartedCycle;
        }
        if (
            currentCycle > lastStartedCycle &&
            cycleFeesPerStakeSummed[lastStartedCycle + 1] == 0
        ) {
            uint256 feePerStake = (cycleAccruedFees[lastStartedCycle] *
                scalingFactor) / summedCycleStakes[lastStartedCycle];
            cycleFeesPerStakeSummed[lastStartedCycle + 1] =
                cycleFeesPerStakeSummed[previousStartedCycle] +
                feePerStake;
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
            emit NewCycleStarted(
                currentCycle,
                calculatedCycleReward,
                summedCycleStakes[currentStartedCycle]
            );
        }
        _;
    }

    modifier updateStats(address account) {
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
                scalingFactor;
            lastFeeUpdateCycle[account] = lastStartedCycle + 1;
        }

        if (
            userFirstStake[account] != 0 &&
            currentCycle - userFirstStake[account] >= 0 &&
            stakedDuringGapCycle[account]
        ) {
            uint256 unlockedFirstStake = userStakeCycle[account][
                userFirstStake[account]
            ];
            addressRewards[account] += unlockedFirstStake;
            userWithdrawableStake[account] += unlockedFirstStake;
            if (lastStartedCycle + 1 > userFirstStake[account]) {
                addressAccruedFees[account] =
                    addressAccruedFees[account] +
                    (
                        (userStakeCycle[account][userFirstStake[account]] *
                            (cycleFeesPerStakeSummed[lastStartedCycle + 1] -
                                cycleFeesPerStakeSummed[
                                    userFirstStake[account]
                                ]))
                    ) /
                    scalingFactor;
            }
            userStakeCycle[account][userFirstStake[account]] = 0;
            userFirstStake[account] = 0;
            stakedDuringGapCycle[account] = false;
        } else if (
            userFirstStake[account] != 0 &&
            currentCycle - userFirstStake[account] > 0
        ) {
            uint256 unlockedFirstStake = userStakeCycle[account][
                userFirstStake[account]
            ];
            addressRewards[account] += unlockedFirstStake;
            userWithdrawableStake[account] += unlockedFirstStake;
            if (lastStartedCycle + 1 > userFirstStake[account]) {
                addressAccruedFees[account] =
                    addressAccruedFees[account] +
                    (
                        (userStakeCycle[account][userFirstStake[account]] *
                            (cycleFeesPerStakeSummed[lastStartedCycle + 1] -
                                cycleFeesPerStakeSummed[
                                    userFirstStake[account]
                                ]))
                    ) /
                    scalingFactor;
            }
            userStakeCycle[account][userFirstStake[account]] = 0;
            userFirstStake[account] = 0;

            if (userSecondStake[account] != 0) {
                if (currentCycle - userSecondStake[account] > 0) {
                    uint256 unlockedSecondStake = userStakeCycle[account][
                        userSecondStake[account]
                    ];
                    addressRewards[account] += unlockedSecondStake;
                    userWithdrawableStake[account] += unlockedSecondStake;
                    if (lastStartedCycle + 1 > userSecondStake[account]) {
                        addressAccruedFees[account] =
                            addressAccruedFees[account] +
                            (
                                (userStakeCycle[account][
                                    userSecondStake[account]
                                ] *
                                    (cycleFeesPerStakeSummed[
                                        lastStartedCycle + 1
                                    ] -
                                        cycleFeesPerStakeSummed[
                                            userSecondStake[account]
                                        ]))
                            ) /
                            scalingFactor;
                    }
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

    constructor(address forwarder) ERC2771Context(forwarder) {
        dbx = new DBX();
        i_initialTimestamp = block.timestamp;
        i_periodDuration = 1 days;
        currentCycleReward = 10000 * 1e18;
        summedCycleStakes[0] = 10000 * 1e18;
        rewardPerCycle[0] = 10000 * 1e18;
    }

    function setKey(string memory publicKey) external {
        publicKeys[_msgSender()] = publicKey;
        bytes32 bodyHash = keccak256(abi.encodePacked(publicKey));
        emit KeySet(_msgSender(), bodyHash, publicKey);
    }

    function getKey(address account) external view returns (string memory) {
        return publicKeys[account];
    }

    function send(
        address[] memory to,
        string[] memory payload,
        address feeReceiver,
        uint256 msgFee,
        uint256 nativeTokenFee
    )
        external
        payable
        gasWrapper(nativeTokenFee)
        calculateCycle
        updateCycleFeesPerStakeSummed
        setUpNewCycle
        updateStats(_msgSender())
    {
        updateFrontEndStats(feeReceiver);

        userCycleMessages[_msgSender()]++;
        cycleTotalMessages[currentCycle]++;
        lastActiveCycle[_msgSender()] = currentCycle;

        if (feeReceiver != address(0)) {
            if (msgFee != 0) {
                userCycleFeePercent[_msgSender()] += msgFee;
                frontendCycleFeePercent[feeReceiver] += msgFee;
            }
            if (nativeTokenFee != 0) {
                frontEndAccruedFees[feeReceiver] += nativeTokenFee;
            }
        }

        uint256 _sentId = _send(to, payload);
        emit SendEntryCreated(
            currentCycle,
            _sentId,
            feeReceiver,
            msgFee,
            nativeTokenFee
        );
    }

    function claimRewards()
        external
        calculateCycle
        updateCycleFeesPerStakeSummed
        updateStats(_msgSender())
    {
        uint256 reward = addressRewards[_msgSender()] -
            userWithdrawableStake[_msgSender()];
        require(reward > 0, "Deb0x: You do not have rewards");
        addressRewards[_msgSender()] -= reward;
        if (lastStartedCycle == currentStartedCycle) {
            pendingStakeWithdrawal += reward;
        } else {
            summedCycleStakes[currentCycle] =
                summedCycleStakes[currentCycle] -
                reward;
        }

        dbx.mintReward(_msgSender(), reward);
        emit RewardsClaimed(currentCycle, _msgSender(), reward);
    }

    function claimFrontEndRewards()
        external
        calculateCycle
        updateCycleFeesPerStakeSummed
    {
        updateFrontEndStats(_msgSender());

        uint256 reward = frontendRewards[_msgSender()];
        require(reward > 0, "Deb0x: You do not have rewards");
        frontendRewards[_msgSender()] = 0;
        if (lastStartedCycle == currentStartedCycle) {
            pendingStakeWithdrawal += reward;
        } else {
            summedCycleStakes[currentCycle] =
                summedCycleStakes[currentCycle] -
                reward;
        }

        dbx.mintReward(_msgSender(), reward);
        emit FrontEndRewardsClaimed(currentCycle, _msgSender(), reward);
    }

    function claimFees()
        external
        calculateCycle
        updateCycleFeesPerStakeSummed
        updateStats(_msgSender())
    {
        uint256 fees = addressAccruedFees[_msgSender()];
        require(fees > 0, "Deb0x: You do not have accrued fees");

        addressAccruedFees[_msgSender()] = 0;
        sendViaCall(payable(_msgSender()), fees);
        emit FeesClaimed(getCurrentCycle(), _msgSender(), fees);
    }

    function claimFrontEndFees()
        external
        calculateCycle
        updateCycleFeesPerStakeSummed
    {
        updateFrontEndStats(_msgSender());
        uint256 fees = frontEndAccruedFees[_msgSender()];
        require(fees > 0, "Deb0x: You do not have accrued fees");

        frontEndAccruedFees[_msgSender()] = 0;
        sendViaCall(payable(_msgSender()), fees);
        emit FrontEndFeesClaimed(getCurrentCycle(), _msgSender(), fees);
    }

    function stakeDBX(uint256 _amount)
        external
        calculateCycle
        updateCycleFeesPerStakeSummed
        updateStats(_msgSender())
    {
        require(_amount != 0, "Deb0x: your amount is 0");
        pendingStake += _amount;
        uint256 cycleToSet = currentCycle + 1;

        if (lastStartedCycle == currentStartedCycle) {
            cycleToSet = currentCycle;
            stakedDuringGapCycle[_msgSender()] = true;
        }

        if (
            (cycleToSet != userFirstStake[_msgSender()] &&
                cycleToSet != userSecondStake[_msgSender()])
        ) {
            if (userFirstStake[_msgSender()] == 0) {
                userFirstStake[_msgSender()] = cycleToSet;
            } else if (userSecondStake[_msgSender()] == 0) {
                userSecondStake[_msgSender()] = cycleToSet;
            }
        }
        userStakeCycle[_msgSender()][cycleToSet] += _amount;

        dbx.transferFrom(_msgSender(), address(this), _amount);
        emit Staked(cycleToSet, _msgSender(), _amount);
    }

    function unstake(uint256 _amount)
        external
        calculateCycle
        updateCycleFeesPerStakeSummed
        updateStats(_msgSender())
    {
        require(_amount != 0, "Deb0x: your amount is 0");
        require(
            _amount <= userWithdrawableStake[_msgSender()],
            "Deb0x: can not unstake more than you've staked"
        );

        if (lastStartedCycle == currentStartedCycle) {
            pendingStakeWithdrawal += _amount;
        } else {
            summedCycleStakes[currentCycle] -= _amount;
        }

        userWithdrawableStake[_msgSender()] -= _amount;
        addressRewards[_msgSender()] -= _amount;

        dbx.transfer(_msgSender(), _amount);
        emit Unstaked(currentCycle, _msgSender(), _amount);
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUserWithdrawableStake(address staker)
        external
        view
        returns (uint256)
    {
        uint256 calculatedCycle = getCurrentCycle();
        uint256 unlockedStake = 0;
        if (
            userFirstStake[staker] != 0 &&
            currentCycle - userFirstStake[staker] >= 0 &&
            stakedDuringGapCycle[staker]
        ) {
            unlockedStake += userStakeCycle[staker][userFirstStake[staker]];
        } else if (
            userFirstStake[staker] != 0 &&
            calculatedCycle - userFirstStake[staker] > 0
        ) {
            unlockedStake += userStakeCycle[staker][userFirstStake[staker]];

            if (
                userSecondStake[staker] != 0 &&
                calculatedCycle - userSecondStake[staker] > 0
            ) {
                unlockedStake += userStakeCycle[staker][
                    userSecondStake[staker]
                ];
            }
        }
        return userWithdrawableStake[staker] + unlockedStake;
    }

    function getUnclaimedFees(address user) external view returns (uint256) {
        uint256 calculatedCycle = getCurrentCycle();
        uint256 currentAccruedFees = addressAccruedFees[user];
        uint256 currentCycleFeesPerStakeSummed;
        uint256 previousStartedCycleTemp = previousStartedCycle;
        uint256 lastStartedCycleTemp = lastStartedCycle;

        if (calculatedCycle != currentStartedCycle) {
            previousStartedCycleTemp = lastStartedCycle + 1;
            lastStartedCycleTemp = currentStartedCycle;
        }

        if (
            calculatedCycle > lastStartedCycleTemp &&
            cycleFeesPerStakeSummed[lastStartedCycleTemp + 1] == 0
        ) {
            uint256 feePerStake = (cycleAccruedFees[lastStartedCycleTemp] *
                scalingFactor) / summedCycleStakes[lastStartedCycleTemp];
            currentCycleFeesPerStakeSummed =
                cycleFeesPerStakeSummed[previousStartedCycle] +
                feePerStake;
        } else {
            currentCycleFeesPerStakeSummed = cycleFeesPerStakeSummed[
                previousStartedCycle
            ];
        }

        uint256 currentRewards = getUnclaimedRewards(user);
        if (
            calculatedCycle > lastStartedCycleTemp &&
            lastFeeUpdateCycle[user] != lastStartedCycleTemp + 1
        ) {
            currentAccruedFees +=
                (
                    (currentRewards *
                        (currentCycleFeesPerStakeSummed -
                            cycleFeesPerStakeSummed[lastFeeUpdateCycle[user]]))
                ) /
                scalingFactor;
        }

        if (
            userFirstStake[user] != 0 &&
            calculatedCycle - userFirstStake[user] > 1
        ) {
            currentAccruedFees +=
                (
                    (userStakeCycle[user][userFirstStake[user]] *
                        (currentCycleFeesPerStakeSummed -
                            cycleFeesPerStakeSummed[userFirstStake[user]]))
                ) /
                scalingFactor;

            if (
                userSecondStake[user] != 0 &&
                calculatedCycle - userSecondStake[user] > 1
            ) {
                currentAccruedFees +=
                    (
                        (userStakeCycle[user][userSecondStake[user]] *
                            (currentCycleFeesPerStakeSummed -
                                cycleFeesPerStakeSummed[userSecondStake[user]]))
                    ) /
                    scalingFactor;
            }
        }
        return currentAccruedFees;
    }

    function getCurrentCycle() public view returns (uint256) {
        return (block.timestamp - i_initialTimestamp) / i_periodDuration;
    }

    function calculateCycleReward() public view returns (uint256) {
        return (lastCycleReward * 10000) / 10020;
    }

    function getUnclaimedRewards(address user) public view returns (uint256) {
        uint256 currentRewards = addressRewards[user];
        uint256 calculatedCycle = getCurrentCycle();

        if (
            calculatedCycle > lastActiveCycle[user] &&
            userCycleMessages[user] != 0
        ) {
            uint256 lastCycleUserReward = (userCycleMessages[user] *
                rewardPerCycle[lastActiveCycle[user]]) /
                cycleTotalMessages[lastActiveCycle[user]];
            currentRewards += lastCycleUserReward;

            if (userCycleFeePercent[user] != 0) {
                uint256 rewardPerMsg = lastCycleUserReward /
                    userCycleMessages[user];
                uint256 rewardsOwed = (rewardPerMsg *
                    userCycleFeePercent[user]) / 10000;
                currentRewards -= rewardsOwed;
            }
        }
        return currentRewards;
    }

    function updateFrontEndStats(address frontend) internal {
        if (currentCycle > frontEndLastRewardUpdate[frontend]) {
            uint256 lastUpdatedCycle = frontEndLastRewardUpdate[frontend];
            if (
                frontendCycleFeePercent[frontend] != 0 &&
                cycleTotalMessages[lastUpdatedCycle] != 0
            ) {
                uint256 rewardPerMsg = rewardPerCycle[lastUpdatedCycle] /
                    cycleTotalMessages[lastUpdatedCycle];
                frontendRewards[frontend] +=
                    (rewardPerMsg * frontendCycleFeePercent[frontend]) /
                    10000;
                frontendCycleFeePercent[frontend] = 0;
            }
            frontEndLastRewardUpdate[frontend] = currentCycle;
        }
        if (
            currentCycle > lastStartedCycle &&
            frontEndLastFeeUpdate[frontend] != lastStartedCycle + 1
        ) {
            frontEndAccruedFees[frontend] +=
                (frontendRewards[frontend] *
                    (cycleFeesPerStakeSummed[lastStartedCycle + 1] -
                        cycleFeesPerStakeSummed[
                            frontEndLastFeeUpdate[frontend]
                        ])) /
                scalingFactor;
            frontEndLastFeeUpdate[frontend] = lastStartedCycle + 1;
        }
    }

    function _send(address[] memory recipients, string[] memory crefs)
        private
        returns (uint256)
    {
        for (uint256 idx = 0; idx < recipients.length - 1; idx++) {
            Envelope memory envelope = Envelope({
                content: crefs[idx],
                timestamp: block.timestamp
            });
            bytes32 bodyHash = keccak256(abi.encodePacked(crefs[idx]));
            emit Sent(
                recipients[idx],
                _msgSender(),
                bodyHash,
                envelope,
                sentId
            );
        }
        Envelope memory selfEnvelope = Envelope({
            content: crefs[recipients.length - 1],
            timestamp: block.timestamp
        });
        bytes32 selfBodyHash = keccak256(
            abi.encodePacked(crefs[recipients.length - 1])
        );
        emit Sent(
            _msgSender(),
            _msgSender(),
            selfBodyHash,
            selfEnvelope,
            sentId
        );

        uint256 oldSentId = sentId;
        sentId++;
        return oldSentId;
    }

    function sendViaCall(address payable _to, uint256 _amount) private {
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Deb0x: failed to send amount");
    }
}
