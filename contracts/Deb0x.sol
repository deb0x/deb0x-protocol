// SPDX-License-Identifier: Deb0x

pragma solidity ^0.8.11;

import "./Deb0xERC20.sol";

contract Deb0x {

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

    function send(address to, string memory payload) public payable {
        require(msg.value >= gasleft() * fee / 10000, "Deb0x: must pay 10% of transaction cost");

        balanceERC20[address(this)] -= 7 * (10 ** 18);
        balanceERC20[msg.sender] += 7 * (10 ** 18);

        messages[to].push(payload);
    }

    function stake(uint256 amount) public {
        require (amount != 0, "Deb0x: your amount is 0");
        
        deboxERC20.approve(address(this), amount);
        deboxERC20.transferFrom(msg.sender, address(this), amount);

        balanceERC20[msg.sender] += amount;
    }

    function unStake(uint256 amount) public {
        require (amount != 0, "Deb0x: your amount is 0");
        require(balanceERC20[msg.sender] - amount >= 0, "Deb0x: insufficient balance");
        
        deboxERC20.approve(address(this), amount);
        deboxERC20.transferFrom(address(this), msg.sender, amount);

        balanceERC20[msg.sender] -= amount;
    }

     function sendViaCall(address payable _to, uint256 _amount) private {
        (bool sent, ) = _to.call { value: _amount } ("");
        require(sent, "Deb0x: failed to send amount");
    }

    function fetchMessages(address to) public view returns (string[] memory) {
        return messages[to];
    }

    ////////////////////////////////////

    uint256 rewardPerToken = 4 wei;

    uint256 lastUpdateTime;

    function earned() public view returns (uint) {
        return 
            balanceERC20[msg.sender] * rewardPerToken * (block.timestamp - lastUpdateTime);
            // balanceERC20 * rewardPerToken * nr of blocks
    }

}
