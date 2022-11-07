pragma solidity ^0.8.17;

import "./Deb0x.sol";
import "hardhat/console.sol";

contract Deb0xAttacker {

    Deb0x deb0xInstance;
    uint256 public counter;

    constructor(address deb0x) {
        deb0xInstance = Deb0x(deb0x);
    }

    // receive() external payable {
    //     address[] memory tempTo;
    //     string[] memory tempPayload;
    //     counter++;
    //     console.log("counter: ", counter);
    //     deb0xInstance.send{value: 100000000 gwei}(tempTo, tempPayload, 0x0000000000000000000000000000000000000000, 0 ,0);
    // }

    function attack() external payable {
        address[] memory tempTo;
        string[] memory tempPayload;

        tempTo[0] = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4;
        tempTo[1] = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4;

        tempPayload[0] = "0x";
        tempPayload[1] = "0x";
        deb0xInstance.send{value: 100000000 gwei}(tempTo, tempPayload, 0x0000000000000000000000000000000000000000, 0 ,0);
    }
}