// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Deb0xERC20.sol";

contract Deb0x is ERC2771Context, ReentrancyGuard {

    /**
     * Deb0x Reward Token contract.
     * Initialized in constructor.
     */
    Deb0xERC20 public dbx;

    /**
     * Basis points (bps) representation of the protocol fee (i.e. 10 percent).
     * Calls to send function charge 1000 bps of transaction cost.
     */
    uint16 public constant PROTOCOL_FEE = 1000;

    /**
     * Basis points representation of 100 percent.
     */
    uint16 public constant MAX_BPS = 10000;

    /**
     * Used to minimise division remainder when earned fees are calculated.
     */
    uint256 public constant SCALING_FACTOR = 1e40;

    /**
     * Contract creation timestamp.
     * Initialized in constructor.
     */
    uint256 public immutable i_initialTimestamp;

    /**
     * Length of a reward distribution cycle. 
     * Initialized in contstructor to 1 day.
     */
    uint256 public immutable i_periodDuration;

    /**
     * Reward token amount allocated for the current cycle.
     */
    uint256 public currentCycleReward;

    /**
     * Reward token amount allocated for the previous cycle.
     */
    uint256 public lastCycleReward;

    /**
     * Helper variable to store pending stake amount.   
     */
    uint256 public pendingStake;

    /**
     * Index (0-based) of the current cycle.
     * 
     * Updated upon cycle setup that is  triggered by contract interraction 
     * (account sends message, claims fees, claims rewards, stakes or unstakes).
     */
    uint256 public currentCycle;

    /**
     * Helper variable to store the index of the last active cycle.
     */
    uint256 public lastStartedCycle;

    /**
     * Stores the value of penultimate active cycle plus one.
     */
    uint256 public previousStartedCycle;

    /**
     * Helper variable to store the index of the last active cycle.
     */
    uint256 public currentStartedCycle;

    uint256 public pendingStakeWithdrawal;

    uint256 public pendingFees;

    uint256 public sentId = 1;

    mapping(address => bytes32) public publicKeys;

    mapping(address => uint256) public accCycleGasOwed;

    mapping(address => uint256) public clientCycleGasEarned;

    mapping(address => uint256) public accCycleGasUsed;

    mapping(uint256 => uint256) public cycleTotalGasUsed;

    /**
     * The last cycle when an account has sent messages.
     */
    mapping(address => uint256) public lastActiveCycle;

    mapping(address => uint256) public clientLastRewardUpdate;

    mapping(address => uint256) public clientLastFeeUpdate;

    mapping(address => uint256) public clientAccruedFees;

    /**
     * Current unclaimed rewards and staked amounts per account.
     */
    mapping(address => uint256) public accRewards;

    mapping(address => uint256) public accAccruedFees;

    mapping(address => uint256) public clientRewards;

    /**
     * Total token rewards allocated per cycle.
     */
    mapping(uint256 => uint256) public rewardPerCycle;

    /**
     * Total unclaimed token reward and stake. 
     * 
     * Updated when a new cycle starts and when an account claims rewards, stakes or unstakes externally owned tokens.
     */
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
        uint256 sentId,
        uint256 timestamp,
        bytes32[] content
    );

    event KeySet(
        address indexed to, 
        bytes32 indexed value
    );

    modifier gasUsed(address feeReceiver, uint256 msgFee) {
        uint256 startGas = gasleft();

        _;

        uint256 gasConsumed = startGas - gasleft();

        cycleTotalGasUsed[currentCycle] += gasConsumed;

        if (feeReceiver != address(0) && msgFee != 0) {
            uint256 gasOwed = (gasConsumed * msgFee) / MAX_BPS;
            gasConsumed -= gasOwed;
            clientCycleGasEarned[feeReceiver] += gasOwed;
        }

        accCycleGasUsed[_msgSender()] += gasConsumed;
        
    }

    modifier gasWrapper(uint256 nativeTokenFee) {
        uint256 startGas = gasleft();

        _;

        uint256 fee = ((startGas - gasleft() + 37700) * tx.gasprice * PROTOCOL_FEE) / MAX_BPS;
        
        require(
            msg.value - nativeTokenFee >= fee,
            "Deb0x: value less than 10% of spent gas"
        );
        
        cycleAccruedFees[currentCycle] += fee;
        sendViaCall(payable(msg.sender), msg.value - fee - nativeTokenFee);
    }

    /**
     * @param forwarder forwarder contract address.
     */
    constructor(address forwarder) ERC2771Context(forwarder) {
        dbx = new Deb0xERC20();
        i_initialTimestamp = block.timestamp;
        i_periodDuration = 1 days;
        currentCycleReward = 10000 * 1e18;
        summedCycleStakes[0] = 10000 * 1e18;
        rewardPerCycle[0] = 10000 * 1e18;
    }

    /**
     * @dev Stores the public key of the sender account.
     * 
     * @param publicKey as encoded by the client.
     */
    function setKey(bytes32 publicKey) external {
        publicKeys[_msgSender()] = publicKey;
        emit KeySet(_msgSender(), publicKey);
    }

    /**
     * @dev Sends messages to multiple accounts. Triggers helper functions 
     * used to update cycle, rewards and fees related state.
     * Optionally may include extra reward token fee and native coin fees on-top of the default protocol fee. 
     * These fees are set by the transaction sender also called "client".
     * 
     * @param to account addresses to send messages to.
     * @param crefs content references to the messages.
     * @param feeReceiver client address.
     * @param msgFee on-top reward token fee charged by the client (in basis points). If 0, no reward token fee applies.
     * @param nativeTokenFee on-top native coin fee charged by the client. If 0, no 
     */
    function send(
        address[] memory to,
        bytes32[][] memory crefs,
        address feeReceiver,
        uint256 msgFee,
        uint256 nativeTokenFee
    )
        external
        payable
        nonReentrant()
        gasWrapper(nativeTokenFee)
        gasUsed(feeReceiver, msgFee)

    {
        require(msgFee <= MAX_BPS, "Deb0x: reward fees exceed 10000 bps");

        uint256 _sentId = _send(to, crefs);
        calculateCycle();
        updateCycleFeesPerStakeSummed();
        setUpNewCycle();
        updateStats(_msgSender());
        updateClientStats(feeReceiver);

        lastActiveCycle[_msgSender()] = currentCycle;
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
        require(reward > 0, "Deb0x: client has no rewards");
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
        require(fees > 0, "Deb0x: amount is zero");

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
        require(fees > 0, "Deb0x: client has no accrued fees");

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
        require(amount > 0, "Deb0x: amount is zero");
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
        require(amount > 0, "Deb0x: amount is zero");

        require(
            amount <= accWithdrawableStake[_msgSender()],
            "Deb0x: amount greater than withdrawable stake"
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

    /**
     * @dev Returns the index of the cycle at the current block time.
     */
    function getCurrentCycle() public view returns (uint256) {
        return (block.timestamp - i_initialTimestamp) / i_periodDuration;
    }

    /**
     * @dev Updates various helper state variables used to compute token rewards 
     * and fees distribution for a given client.
     * 
     * @param client the address of the client to make the updates for.
     */
    function updateClientStats(address client) internal {
        if (currentCycle > clientLastRewardUpdate[client]) {
            uint256 lastUpdatedCycle = clientLastRewardUpdate[client];

            if (
                clientCycleGasEarned[client] != 0 &&
                cycleTotalGasUsed[lastUpdatedCycle] != 0
            ) {
                uint256 clientRewardsEarned = (clientCycleGasEarned[client] * rewardPerCycle[lastUpdatedCycle]) / 
                    cycleTotalGasUsed[lastUpdatedCycle];
                clientRewards[client] += clientRewardsEarned;
                clientCycleGasEarned[client] = 0;
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

    /**
     * @dev Updates the index of the cycle.
     */
    function calculateCycle() internal {
        uint256 calculatedCycle = getCurrentCycle();
        
        if (calculatedCycle > currentCycle) {
            currentCycle = calculatedCycle;
        }
        
    }

    /**
     * @dev Updates the global helper variables related to fee distribution.
     */
    function updateCycleFeesPerStakeSummed() internal {
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

    /**
     * @dev Updates the global state related to the opening of a new cycle along 
     * with helper state variables used in computation of staking rewards.
     */
    function setUpNewCycle() internal {
        if (rewardPerCycle[currentCycle] == 0) {
            lastCycleReward = currentCycleReward;
            uint256 calculatedCycleReward = (lastCycleReward * 10000) / 10020;
            currentCycleReward = calculatedCycleReward;
            rewardPerCycle[currentCycle] = calculatedCycleReward;

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

    /**
     * @dev Updates various helper state variables used to compute token rewards 
     * and fees distribution for a given account.
     * 
     * @param account the address of the account to make the updates for.
     */
    function updateStats(address account) internal {
         if (	
            currentCycle > lastActiveCycle[account] &&	
            accCycleGasUsed[account] != 0	
        ) {	
            uint256 lastCycleAccReward = (accCycleGasUsed[account] * rewardPerCycle[lastActiveCycle[account]]) / 	
                cycleTotalGasUsed[lastActiveCycle[account]];	
            accRewards[account] += lastCycleAccReward;	
         
            accCycleGasUsed[account] = 0;
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
            currentCycle > accFirstStake[account]
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
                if (currentCycle > accSecondStake[account]) {
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

    /**
     * @dev For each recipient emits events with correspondig cref.
     * Lengths of recipients and crefs arrays must match.
     * All crefs (content references) must be less than 8 bytes32 long and 
     * are purposed to store pointers (e.g. HTTP urls, IPFS CIDs) to messages content.
     * 
     * @param recipients recipient addresses that messages are stored for.
     * @param crefs content references to the messages.
     */
    function _send(address[] memory recipients, bytes32[][] memory crefs)
        internal
        returns (uint256)
    {
        require(recipients.length == crefs.length, "Deb0x: crefs and recipients lengths not equal");
        require(recipients.length > 0, "Deb0x: recipients array empty");
        for (uint256 idx = 0; idx < recipients.length - 1; idx++) {
            require(crefs[recipients.length - 1].length <= 8 , "Deb0x: cref too long");
        }

        for (uint256 idx = 0; idx < recipients.length - 1; idx++) {
            bytes32 bodyHash = keccak256(abi.encodePacked(crefs[idx]));
     
            emit Sent(
                recipients[idx],
                _msgSender(),
                bodyHash,
                sentId,
                block.timestamp,
                crefs[idx]
            );
        }

        bytes32 selfBodyHash = keccak256(
            abi.encodePacked(crefs[recipients.length - 1])
        );
        require(crefs[recipients.length - 1].length <= 8 , "Deb0x: cref too long");

        uint256 oldSentId = sentId;
        sentId++;

        emit Sent(
            _msgSender(),
            _msgSender(),
            selfBodyHash,
            oldSentId,
            block.timestamp,
            crefs[recipients.length - 1]
        );

        return oldSentId;
    }

    /**
     * Recommended method to use to send native coins.
     * 
     * @param to receiving address
     * @param amount in wei
     */
    function sendViaCall(address payable to, uint256 amount) internal {
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Deb0x: failed to send amount");
    }
}
