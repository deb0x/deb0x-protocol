// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract Deb0xCore is ERC2771Context {
  
    struct content {
        string cid;
        uint256 blockTimestamp;
    }

    struct sentMessage {
        address[] recipients;
        content contentData;
    }

    mapping(address => string) public encryptionKeys;

    mapping(address => mapping(address => content[])) private inbox;

    mapping(address => sentMessage[]) private outbox;

    mapping(address => address[]) private messageSenders;

    constructor(address forwarder)
    ERC2771Context(forwarder) {}

    function setKey(string memory encryptionKey) public {
        encryptionKeys[_msgSender()] = encryptionKey;
    }

    function send(address[] memory recipients, string[] memory cids) public payable virtual {
        for (uint256 i = 0; i < recipients.length - 1; i++) {
            if (inbox[recipients[i]][_msgSender()].length == 0) {
                messageSenders[recipients[i]].push(_msgSender());
            }
            content memory currentStruct = content({cid:cids[i], blockTimestamp: block.timestamp});
            inbox[recipients[i]][_msgSender()].push(currentStruct);
        }

        content memory outboxContent = content({cid: cids[recipients.length -1 ], blockTimestamp:block.timestamp});
        outbox[_msgSender()].push(
            sentMessage({
                recipients: recipients,
                contentData: outboxContent
            })
        );
    }

    function getKey(address account) public view returns (string memory) {
        return encryptionKeys[account];
    }

    function fetchMessages(address to, address from)
        public
        view
        returns (content[] memory)
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
