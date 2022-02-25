// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "./Deb0xERC20.sol";

contract Deb0x {
    //Message setup
    Deb0xERC20 public deboxERC20;

    uint16 public constant fee = 1000;

    bool initializeFlag = false;

    mapping(address => string) private encryptionKeys;

    mapping (address => mapping(address => string[])) private messages;

    mapping (address => address[]) private messageSenders;

    mapping(address => uint256) public balanceERC20;

    //Tokenomic setup
    uint256 public rewardRate = 100;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 public totalSupply;

    constructor() {
        deboxERC20 = new Deb0xERC20(address(this));
    }

    function initialize() public {
        require(initializeFlag == false,
            "Deb0x: initialize() can be called just once"
        );

        deboxERC20.approve(address(this), deboxERC20.totalSupply());
        balanceERC20[address(this)] = deboxERC20.totalSupply();

        initializeFlag = true;
    }
    //Message Functions
    function setKey(string memory encryptionKey) public {
        encryptionKeys[msg.sender] = encryptionKey;
    }

    function send(address to, string memory payload)
        public
        payable
        updateReward(msg.sender)
    {
        require(
            msg.value >= (gasleft() * fee) / 10000,
            "Deb0x: must pay 10% of transaction cost"
        );

        if(messages[to][msg.sender].length == 0){
            messageSenders[to].push(msg.sender);
        }

        balanceERC20[address(this)] -= 73;
        balanceERC20[msg.sender] += 73;

        totalSupply += 73;

        messages[to][msg.sender].push(payload);
    }
    
    function getKey(address account) public view returns (string memory) {
        return encryptionKeys[account];
    }

    function fetchMessages(address to, address from) public view returns (string[] memory) {
        return messages[to][from];
    }

    function fetchMessageSenders(address to) public view returns (address[] memory) {
        return messageSenders[to];
    }

    //Tokenomic functions
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        rewards[account] = earnedNative(account);
        userRewardPerTokenPaid[account] = rewardPerTokenStored;
        _;
    }

    function stakeERC20(uint256 _amount) external updateReward(msg.sender) {
        require(_amount != 0, "Deb0x: your amount is 0");
      
        totalSupply += _amount;
        balanceERC20[msg.sender] += _amount;

        deboxERC20.transferFrom(msg.sender, address(this), _amount);
    }
    
    function unStakeERC20(uint256 _amount) external updateReward(msg.sender) {
        require(_amount != 0, "Deb0x: your amount is 0");
        require(balanceERC20[msg.sender] - _amount >= 0, "Deb0x: insufficient balance");

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
        if (totalSupply == 0) { return 0; }
        
        return
            rewardPerTokenStored +
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) /
                totalSupply);
    }

     function earnedNative(address account) public view returns (uint256) {
        int256 earned = ((int256(balanceERC20[account]) *
            (int256(rewardPerToken()) -
                int256(userRewardPerTokenPaid[account]))) / 1e18) +
            int256(rewards[account]);
        require(earned >= 0, "Deb0x: calculus is under 0");
        return uint256(earned);
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}