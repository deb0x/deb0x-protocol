// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./Deb0x.sol";

contract Deb0xGovernor{

    Deb0x public deb0x;

     constructor() {
        deb0x = new Deb0x();
    }


    function test() public {
        deb0x.setFee(2000);
    }

}
