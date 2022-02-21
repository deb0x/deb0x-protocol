// SPDX-License-Identifier: Deb0x
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Deb0xERC20 is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 1000000 * (10 ** 18);

    constructor(address deb0x) ERC20("Deb0x", "DBX") {
        _mint(deb0x, TOTAL_SUPPLY);

    }
}
