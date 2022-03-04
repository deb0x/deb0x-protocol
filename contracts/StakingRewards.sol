// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./Deb0xERC20.sol";

contract StakingRewards {

    uint public rewardRate = 100;
    uint public lastUpdateTime;
    uint public rewardPerTokenStored;

    mapping(address => uint) public userRewardPerTokenPaid;
    mapping(address => uint) public rewards;

    uint private _totalSupply;
    mapping(address => uint) private _balances;

    Deb0xERC20 public deboxERC20;

    uint256 constant public fee = 1000;
    
    bool initializeFlag = false;

    mapping (address => string) private encryptionKeys;

    mapping (address => string[]) private messages;

    mapping (address => uint256) public balanceERC20;

    constructor(){
       deboxERC20 = new Deb0xERC20(address(this));

    }

    function initialize () public {
        require(initializeFlag == false, "Deb0x: initialize() can be called just once");

        deboxERC20.approve(address(this), deboxERC20.totalSupply());
        balanceERC20[address(this)] = deboxERC20.totalSupply();

        initializeFlag = true;
    }

    function setKey(string memory encryptionKey) public {
        encryptionKeys[msg.sender] = encryptionKey;
    }

    function getKey(address account) public view returns (string memory) {
        return encryptionKeys[account];
    }

    function send(address to, string memory payload) updateReward(msg.sender) public payable {
        require(msg.value >= gasleft() * fee / 10000, "Deb0x: must pay 10% of transaction cost");

        balanceERC20[address(this)] -= 73;
        balanceERC20[msg.sender] += 73;

        messages[to].push(payload);
    }

    function rewardPerToken() public view returns (uint) {
        if (_totalSupply == 0) {
            return 0;
        }
        return
            rewardPerTokenStored +
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / _totalSupply);
    }

    function earned(address account) public view returns (uint) {

        int256 x =((int(_balances[account]) * (int(rewardPerToken()) - int(userRewardPerTokenPaid[account]))) / 1e18) + int(rewards[account]);
         require(x >= 0, "calculus is under 0");
        return uint256(x);
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        rewards[account] = earned(account);
        userRewardPerTokenPaid[account] = rewardPerTokenStored;
        _;
    }

    function stake(uint _amount) external payable updateReward(msg.sender) {
         require (_amount != 0, "Deb0x: your amount is 0");
          require(msg.value >= gasleft() * rewardRate / 10000, "Deb0x: must pay 10% of transaction cost");
        _totalSupply += _amount;
        _balances[msg.sender] += _amount;
        deboxERC20.transferFrom(msg.sender, address(this), _amount);
    }

    function unStake(uint _amount) external updateReward(msg.sender) {
        require (_amount != 0, "Deb0x: your amount is 0");
        require(balanceERC20[msg.sender] - _amount >= 0, "Deb0x: insufficient balance");

        _totalSupply -= _amount;
        _balances[msg.sender] -= _amount;
        deboxERC20.transfer(msg.sender, _amount);
    }

    function fetchMessages(address to) public view returns (string[] memory) {
        return messages[to];
    }

    function getReward() external updateReward(msg.sender) {
        uint reward = rewards[msg.sender];

        require(reward > 0, "your reward is 0");
        rewards[msg.sender] = 0;
        //rewardsToken.transfer(msg.sender, reward);
        sendViaCall(payable(msg.sender), reward);
    }

    function sendViaCall(address payable _to, uint256 _amount) private {
        (bool sent, ) = _to.call { value: _amount } ("");
        require(sent, "PayableMinter: failed to send amount");
    }

    function contractBalance() public view returns(uint256) {
        return address(this).balance;
    }
}


