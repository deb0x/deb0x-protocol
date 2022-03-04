// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20StandardB is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 50000000 * (10**uint256(18));

    constructor() ERC20("TKB", "TKB") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}