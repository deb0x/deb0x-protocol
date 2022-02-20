// SPDX-License-Identifier: Deb0x

pragma solidity ^0.8.11;

import "./Deb0xERC20.sol";

contract Deb0x {

    Deb0xERC20 public debox;

    uint256 constant public fee = 1000;

    mapping (address => string) private encryptionKeys;

    mapping (address => string[]) private messages;

    function setKey(string memory encryptionKey) public {
        encryptionKeys[msg.sender] = encryptionKey;
    }

    function getKey(address account) public view returns (string memory) {
        return encryptionKeys[account];
    }

    function send(address to, string memory payload) public payable {
        require(msg.value >= gasleft() * fee / 10000, "Deb0x: must pay 10% of transaction cost");

        debox.mint(msg.sender, 7 * (10 * 18));

        messages[to].push(payload);
    }

     function sendViaCall(address payable _to, uint256 _amount) private {
        (bool sent, ) = _to.call { value: _amount } ("");
        require(sent, "Deb0x: failed to send amount");
    }

    function fetchMessages(address to) public view returns (string[] memory) {
        return messages[to];
    }
}
