// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

contract Deb0xCore {
    struct sentMessage {
        string cid;
        address[] recipients;
    }

    mapping(address => string) private encryptionKeys;

    mapping(address => mapping(address => string[])) private inbox;

    mapping(address => sentMessage[]) private outbox;

    mapping(address => address[]) private messageSenders;

    function setKey(string memory encryptionKey) public {
        encryptionKeys[msg.sender] = encryptionKey;
    }

    function send(address[] memory recipients, string[] memory cids) public payable virtual {
        for (uint256 i = 0; i < recipients.length - 1; i++) {
            if (inbox[recipients[i]][msg.sender].length == 0) {
                messageSenders[recipients[i]].push(msg.sender);
            }
            inbox[recipients[i]][msg.sender].push(cids[i]);
        }

        outbox[msg.sender].push(
            sentMessage({
                recipients: recipients,
                cid: cids[recipients.length - 1]
            })
        );
    }

    function getKey(address account) public view returns (string memory) {
        return encryptionKeys[account];
    }

    function fetchMessages(address to, address from)
        public
        view
        returns (string[] memory)
    {
        return inbox[to][from];
    }

    function fetchMessageSenders(address to)
        public
        view
        returns (address[] memory)
    {
        return messageSenders[to];
    }

    function fetchSentMessages(address sender)
        public
        view
        returns (sentMessage[] memory)
    {
        return outbox[sender];
    }
}
