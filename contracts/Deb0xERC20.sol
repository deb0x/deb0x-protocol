// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";


contract Deb0xERC20 is ERC20Permit {
    address public immutable owner;

    constructor() ERC20("Deb0x Reward Token on Polygon", "pDBX")
    ERC20Permit("Deb0x Reward Token on Polygon") {
        owner = msg.sender;
    }

    function mintReward(address account, uint256 amount) external {
        require(msg.sender == owner, "DBX: caller is not Deb0x contract.");
        require(super.totalSupply() < 5010000000000000000000000, "DBX: max supply already minted");
        _mint(account, amount);
    }
}
