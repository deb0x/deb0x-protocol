// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Deb0xERC20.sol";

contract Deb0x is ERC2771Context, ReentrancyGuard {

    struct Envelope {
        string content;
        uint256 timestamp;
    }

    Deb0xERC20 public dbx;

    uint16 public constant PROTOCOL_FEE = 1000;

    uint256 public constant SCALING_FACTOR = 1e18;

    uint256 public immutable i_initialTimestamp;

    uint256 public immutable i_periodDuration;

    uint256 public currentCycleReward;

    uint256 public lastCycleReward;

    uint256 public pendingStake;

    uint256 public currentCycle;

    uint256 public lastStartedCycle;

    uint256 public previousStartedCycle;

    uint256 public currentStartedCycle;

    uint256 public pendingCycleRewardsStake;

    uint256 public pendingStakeWithdrawal;

    uint256 public pendingFees;

    uint256 public sentId = 1;

    mapping(address => string) public publicKeys;

    mapping(address => uint256) public accCycleFeePercent;

    mapping(address => uint256) public clientCycleFeePercent;

    mapping(address => uint256) public accCycleMessages;

    mapping(uint256 => uint256) public cycleTotalMessages;

    mapping(address => uint256) public lastActiveCycle;

    mapping(address => uint256) public clientLastRewardUpdate;

    mapping(address => uint256) public clientLastFeeUpdate;

    mapping(address => uint256) public clientAccruedFees;

    mapping(address => uint256) public accRewards;

    mapping(address => uint256) public accAccruedFees;

    mapping(address => uint256) public clientRewards;

    mapping(uint256 => uint256) public rewardPerCycle;

    mapping(uint256 => uint256) public summedCycleStakes;

    mapping(address => uint256) public lastFeeUpdateCycle;

    mapping(uint256 => uint256) public cycleAccruedFees;

    mapping(uint256 => uint256) public cycleFeesPerStakeSummed;

    mapping(address => mapping(uint256 => uint256)) public accStakeCycle;

    mapping(address => uint256) public accWithdrawableStake;

    mapping(address => uint256) public accFirstStake;

    mapping(address => uint256) public accSecondStake;

    mapping(address => bool) public stakedDuringGapCycle;

    event ClientFeesClaimed(
        uint256 indexed cycle,
        address indexed account,
        uint256 fees
    );

    event FeesClaimed(
        uint256 indexed cycle,
        address indexed account,
        uint256 fees
    );

    event Staked(
        uint256 indexed cycle,
        address indexed account,
        uint256 amount
    );

    event Unstaked(
        uint256 indexed cycle,
        address indexed account,
        uint256 amount
    );

    event ClientRewardsClaimed(
        uint256 indexed cycle,
        address indexed account,
        uint256 amount
    );

    event RewardsClaimed(
        uint256 indexed cycle,
        address indexed account,
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

        uint256 fee = ((startGas - gasleft() + 37700) * tx.gasprice * PROTOCOL_FEE) / 10000;
        
        require(
            msg.value - nativeTokenFee >= fee,
            "Deb0x: value must be >= 10% of the spent gas"
        );
        
        cycleAccruedFees[currentCycle] += fee;
        sendViaCall(payable(msg.sender), msg.value - fee - nativeTokenFee);
    }

    function calculateCycle() private {
        uint256 calculatedCycle = getCurrentCycle();
        
        if (calculatedCycle > currentCycle) {
            currentCycle = calculatedCycle;
        }
        
    }

    function updateCycleFeesPerStakeSummed() private {
        if (currentCycle != currentStartedCycle) {
            previousStartedCycle = lastStartedCycle + 1;
            lastStartedCycle = currentStartedCycle;
        }
       
        if (
            currentCycle > lastStartedCycle &&
            cycleFeesPerStakeSummed[lastStartedCycle + 1] == 0
        ) {
            uint256 feePerStake;
            if(summedCycleStakes[lastStartedCycle] != 0) {
                feePerStake = ((cycleAccruedFees[lastStartedCycle] + pendingFees) * SCALING_FACTOR) / 
            summedCycleStakes[lastStartedCycle];
                pendingFees = 0;
            } else {
                pendingFees += cycleAccruedFees[lastStartedCycle];
                feePerStake = 0;
            }
            
            cycleFeesPerStakeSummed[lastStartedCycle + 1] = cycleFeesPerStakeSummed[previousStartedCycle] + feePerStake;
        }

    }

    function setUpNewCycle() private {
        if (rewardPerCycle[currentCycle] == 0) {
            lastCycleReward = currentCycleReward;
            uint256 calculatedCycleReward = (lastCycleReward * 10000) / 10020;
            currentCycleReward = calculatedCycleReward;
            rewardPerCycle[currentCycle] = calculatedCycleReward;
            pendingCycleRewardsStake = calculatedCycleReward;

            currentStartedCycle = currentCycle;
            
            summedCycleStakes[currentStartedCycle] += summedCycleStakes[lastStartedCycle] + currentCycleReward;
            
            if (pendingStake != 0) {
                summedCycleStakes[currentStartedCycle] += pendingStake;
                pendingStake = 0;
            }
            
            if (pendingStakeWithdrawal != 0) {
                summedCycleStakes[currentStartedCycle] -= pendingStakeWithdrawal;
                pendingStakeWithdrawal = 0;
            }
            
            emit NewCycleStarted(
                currentCycle,
                calculatedCycleReward,
                summedCycleStakes[currentStartedCycle]
            );
        }

    }

    function updateStats(address account) private {
        if (
            currentCycle > lastActiveCycle[account] &&
            accCycleMessages[account] != 0
        ) {
            uint256 lastCycleAccReward = (accCycleMessages[account] * rewardPerCycle[lastActiveCycle[account]]) / 
            cycleTotalMessages[lastActiveCycle[account]];

            accRewards[account] += lastCycleAccReward;

            if (accCycleFeePercent[account] != 0) {
                uint256 rewardPerMsg = lastCycleAccReward / accCycleMessages[account];

                uint256 rewardsOwed = (rewardPerMsg * accCycleFeePercent[account]) / 10000;

                accRewards[account] -= rewardsOwed;
                accCycleFeePercent[account] = 0;
            }

            accCycleMessages[account] = 0;
        }

        if (
            currentCycle > lastStartedCycle &&
            lastFeeUpdateCycle[account] != lastStartedCycle + 1
        ) {
            accAccruedFees[account] =
                accAccruedFees[account] +
                (
                    (accRewards[account] * 
                        (cycleFeesPerStakeSummed[lastStartedCycle + 1] - 
                            cycleFeesPerStakeSummed[lastFeeUpdateCycle[account]]
                        )
                    )
                ) /
                SCALING_FACTOR;
            lastFeeUpdateCycle[account] = lastStartedCycle + 1;
        }

        if (
            accFirstStake[account] != 0 &&
            currentCycle - accFirstStake[account] >= 0 &&
            stakedDuringGapCycle[account]
        ) {
            uint256 unlockedFirstStake = accStakeCycle[account][accFirstStake[account]];

            accRewards[account] += unlockedFirstStake;
            accWithdrawableStake[account] += unlockedFirstStake;
            if (lastStartedCycle + 1 > accFirstStake[account]) {
                accAccruedFees[account] = accAccruedFees[account] + 
                (
                    (accStakeCycle[account][accFirstStake[account]] * 
                        (cycleFeesPerStakeSummed[lastStartedCycle + 1] - 
                            cycleFeesPerStakeSummed[accFirstStake[account]]
                        )
                    )
                ) /
                SCALING_FACTOR;
            }

            accStakeCycle[account][accFirstStake[account]] = 0;
            accFirstStake[account] = 0;
            stakedDuringGapCycle[account] = false;
        } else if (
            accFirstStake[account] != 0 &&
            currentCycle - accFirstStake[account] > 0
        ) {
            uint256 unlockedFirstStake = accStakeCycle[account][accFirstStake[account]];

            accRewards[account] += unlockedFirstStake;
            accWithdrawableStake[account] += unlockedFirstStake;
            if (lastStartedCycle + 1 > accFirstStake[account]) {
                accAccruedFees[account] = accAccruedFees[account] + 
                (
                    (accStakeCycle[account][accFirstStake[account]] * 
                        (cycleFeesPerStakeSummed[lastStartedCycle + 1] - 
                            cycleFeesPerStakeSummed[accFirstStake[account]]
                        )
                    )
                ) / 
                SCALING_FACTOR;
            }

            accStakeCycle[account][accFirstStake[account]] = 0;
            accFirstStake[account] = 0;

            if (accSecondStake[account] != 0) {
                if (currentCycle - accSecondStake[account] > 0) {
                    uint256 unlockedSecondStake = accStakeCycle[account][accSecondStake[account]];

                    accRewards[account] += unlockedSecondStake;
                    accWithdrawableStake[account] += unlockedSecondStake;
                    
                    if (lastStartedCycle + 1 > accSecondStake[account]) {
                        accAccruedFees[account] = accAccruedFees[account] + 
                        (
                            (accStakeCycle[account][accSecondStake[account]] * 
                                (cycleFeesPerStakeSummed[lastStartedCycle + 1] - 
                                    cycleFeesPerStakeSummed[accSecondStake[account]]
                                )
                            )
                        ) / 
                        SCALING_FACTOR;
                    }

                    accStakeCycle[account][accSecondStake[account]] = 0;
                    accSecondStake[account] = 0;
                } else {
                    accFirstStake[account] = accSecondStake[account];
                    accSecondStake[account] = 0;
                }
            }
        }

    }

    constructor(address forwarder) ERC2771Context(forwarder) {
        dbx = new Deb0xERC20();
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
    {
        calculateCycle();
        updateCycleFeesPerStakeSummed();
        updateStats(_msgSender());
        setUpNewCycle();
        require(msgFee < 10001, "Deb0x: Reward fees can not exceed 100%");
        updateClientStats(feeReceiver);

        accCycleMessages[_msgSender()] += to.length;
        cycleTotalMessages[currentCycle] += to.length;
        lastActiveCycle[_msgSender()] = currentCycle;

        if (feeReceiver != address(0)) {
            if (msgFee != 0) {
                accCycleFeePercent[_msgSender()] += msgFee;
                clientCycleFeePercent[feeReceiver] += msgFee;
            }

            if (nativeTokenFee != 0) {
                clientAccruedFees[feeReceiver] += nativeTokenFee;
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
        nonReentrant()
    {
        calculateCycle();
        updateCycleFeesPerStakeSummed();
        updateStats(_msgSender());
        uint256 reward = accRewards[_msgSender()] -
            accWithdrawableStake[_msgSender()];

        require(reward > 0, "Deb0x: account has no rewards");

        accRewards[_msgSender()] -= reward;
        
        if (lastStartedCycle == currentStartedCycle) {
            pendingStakeWithdrawal += reward;
        } else {
            summedCycleStakes[currentCycle] = summedCycleStakes[currentCycle] - reward;
        }

        dbx.mintReward(_msgSender(), reward);
        emit RewardsClaimed(currentCycle, _msgSender(), reward);
    }

    function claimClientRewards()
        external
        nonReentrant()
    {
        calculateCycle();
        updateCycleFeesPerStakeSummed();

        updateClientStats(_msgSender());

        uint256 reward = clientRewards[_msgSender()];
        require(reward > 0, "Deb0x: account has no rewards");
        clientRewards[_msgSender()] = 0;

        if (lastStartedCycle == currentStartedCycle) {
            pendingStakeWithdrawal += reward;
        } else {
            summedCycleStakes[currentCycle] = summedCycleStakes[currentCycle] - reward;
        }

        dbx.mintReward(_msgSender(), reward);
        emit ClientRewardsClaimed(currentCycle, _msgSender(), reward);
    }

    function claimFees()
        external
        nonReentrant()
    {
        calculateCycle();
        updateCycleFeesPerStakeSummed();
        updateStats(_msgSender());

        uint256 fees = accAccruedFees[_msgSender()];
        require(fees > 0, "Deb0x: account has no accrued fees");

        accAccruedFees[_msgSender()] = 0;
        sendViaCall(payable(_msgSender()), fees);
        emit FeesClaimed(getCurrentCycle(), _msgSender(), fees);
    }

    function claimClientFees()
        external
        nonReentrant()
    {
        calculateCycle();
        updateCycleFeesPerStakeSummed();

        updateClientStats(_msgSender());
        uint256 fees = clientAccruedFees[_msgSender()];
        require(fees > 0, "Deb0x: account has no accrued fees");

        clientAccruedFees[_msgSender()] = 0;
        sendViaCall(payable(_msgSender()), fees);
        emit ClientFeesClaimed(getCurrentCycle(), _msgSender(), fees);
    }

    function stakeDBX(uint256 amount)
        external
        nonReentrant()
    {
        calculateCycle();
        updateCycleFeesPerStakeSummed();
        updateStats(_msgSender());
        require(amount != 0, "Deb0x: amount arg is zero");
        pendingStake += amount;
        uint256 cycleToSet = currentCycle + 1;

        if (lastStartedCycle == currentStartedCycle) {
            cycleToSet = currentCycle;
            stakedDuringGapCycle[_msgSender()] = true;
        }

        if (
            (cycleToSet != accFirstStake[_msgSender()] &&
                cycleToSet != accSecondStake[_msgSender()])
        ) {
            if (accFirstStake[_msgSender()] == 0) {
                accFirstStake[_msgSender()] = cycleToSet;
            } else if (accSecondStake[_msgSender()] == 0) {
                accSecondStake[_msgSender()] = cycleToSet;
            }
        }

        accStakeCycle[_msgSender()][cycleToSet] += amount;

        dbx.transferFrom(_msgSender(), address(this), amount);
        emit Staked(cycleToSet, _msgSender(), amount);
    }

    function unstake(uint256 amount)
        external
        nonReentrant()
    {
        calculateCycle();
        updateCycleFeesPerStakeSummed();
        updateStats(_msgSender());
        require(amount != 0, "Deb0x: amount arg is zero");

        require(
            amount <= accWithdrawableStake[_msgSender()],
            "Deb0x: can not unstake more than withdrawable stake"
        );

        if (lastStartedCycle == currentStartedCycle) {
            pendingStakeWithdrawal += amount;
        } else {
            summedCycleStakes[currentCycle] -= amount;
        }

        accWithdrawableStake[_msgSender()] -= amount;
        accRewards[_msgSender()] -= amount;

        dbx.transfer(_msgSender(), amount);
        emit Unstaked(currentCycle, _msgSender(), amount);
    }

    function getCurrentCycle() public view returns (uint256) {
        return (block.timestamp - i_initialTimestamp) / i_periodDuration;
    }

    function updateClientStats(address client) internal {
        if (currentCycle > clientLastRewardUpdate[client]) {
            uint256 lastUpdatedCycle = clientLastRewardUpdate[client];

            if (
                clientCycleFeePercent[client] != 0 &&
                cycleTotalMessages[lastUpdatedCycle] != 0
            ) {
                uint256 rewardPerMsg = rewardPerCycle[lastUpdatedCycle] / cycleTotalMessages[lastUpdatedCycle];
                clientRewards[client] += (rewardPerMsg * clientCycleFeePercent[client]) / 10000;
                clientCycleFeePercent[client] = 0;
            }

            clientLastRewardUpdate[client] = currentCycle;
        }

        if (
            currentCycle > lastStartedCycle &&
            clientLastFeeUpdate[client] != lastStartedCycle + 1
        ) {
            clientAccruedFees[client] += (
                clientRewards[client] * 
                    (cycleFeesPerStakeSummed[lastStartedCycle + 1] - 
                        cycleFeesPerStakeSummed[clientLastFeeUpdate[client]]
                    )
            ) /
            SCALING_FACTOR;

            clientLastFeeUpdate[client] = lastStartedCycle + 1;
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

    function sendViaCall(address payable to, uint256 amount) private {
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Deb0x: failed to send amount");
    }
}
