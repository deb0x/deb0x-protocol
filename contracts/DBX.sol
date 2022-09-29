// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DBX is ERC20 {
    address public owner;

    //RV: rename token to something like "Deb0x Reward Token".
    constructor() ERC20("Deb0x", "DBX") {
        owner = msg.sender;
    }

    function mintReward(address user, uint256 amount) external {
        require(msg.sender == owner, "Caller is not Deb0x contract.");
        _mint(user, amount);
    }
}
