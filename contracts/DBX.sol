// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DBX is ERC20 {

    address public owner;

    constructor() ERC20("Deb0x Reward Token on Polygon", "pDBX") {
        owner = msg.sender;
    }

    function mintReward(address user, uint256 amount) external {
        require(msg.sender == owner, "DBX: caller is not Deb0x contract.");
        _mint(user, amount);
    }
}
