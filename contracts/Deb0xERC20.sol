// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Deb0xERC20 is ERC20 {

    address public owner;

    constructor() ERC20("Deb0x Reward Token on Polygon", "pDBX") {
        owner = msg.sender;
    }

    function mintReward(address user, uint256 amount) external {
        require(msg.sender == owner, "DBX: caller is not Deb0x contract.");
        require(ERC20(address(this)).totalSupply() < 5010000000000000000000000);
        _mint(user, amount);
    }
}
