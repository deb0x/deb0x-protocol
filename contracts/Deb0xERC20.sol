// SPDX-License-Identifier: Deb0x
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Deb0xERC20 is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 1000000 * (10 ** 18);

    address public deb0x = 0x17D32D28280e6EfBDC93840C5742101851dCF853;

    constructor() ERC20("Deb0x", "DBX") {
        _mint(deb0x, TOTAL_SUPPLY);

    }
}
