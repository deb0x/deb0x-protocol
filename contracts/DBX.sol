// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";
contract DBX is ERC20 {
    address public owner;

    constructor() ERC20("Deb0x", "DBX") {
        owner = msg.sender;
    }

    function mintReward(address user, uint256 amount) external {
        require(msg.sender == owner, "Caller is not Deb0x contract.");
        require(ERC20(address(this)).totalSupply() < 5100000000000000000000000);
        _mint(user, amount);
    }
}
