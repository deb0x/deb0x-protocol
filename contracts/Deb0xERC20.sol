// SPDX-License-Identifier: Deb0x
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Deb0xERC20 is ERC20 {
    constructor() ERC20("Deb0x", "DBX") {}

    function mint(address beneficiary, uint256 mintAmount) external {
        _mint(beneficiary, mintAmount);
    }
}
