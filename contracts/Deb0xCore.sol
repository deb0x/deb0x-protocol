// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

contract Deb0xCore {
    
    event Sent(address indexed to, address indexed from, bytes32 indexed hash, Envelope body);
    event KeySet(address indexed to, bytes32 indexed hash, string value);

    struct Envelope {
        string content;
        uint256 timestamp;
    }

    struct sentMessage {
        address[] recipients;
        Envelope contentData;
    }

    mapping(address => string) public publicKeys;

    mapping(address => mapping(address => Envelope[])) private inbox;

    mapping(address => sentMessage[]) private outbox;

    mapping(address => address[]) private messageSenders;

    function setKey(string memory publicKey) public {
        publicKeys[msg.sender] = publicKey;
        bytes32 bodyHash= keccak256(abi.encodePacked(publicKey));
        emit KeySet(msg.sender, bodyHash, publicKey);
    }

    function send(address[] memory recipients, string[] memory cids) public payable virtual {
        for (uint256 i = 0; i < recipients.length - 1; i++) {
            if (inbox[recipients[i]][msg.sender].length == 0) {
                messageSenders[recipients[i]].push(msg.sender);
            }
            Envelope memory currentStruct = Envelope({content:cids[i], timestamp: block.timestamp});
            inbox[recipients[i]][msg.sender].push(currentStruct);
            bytes32 bodyHash= keccak256(abi.encodePacked(cids[i]));
            emit Sent(recipients[i], msg.sender, bodyHash, currentStruct);
        }

        Envelope memory outboxContent = Envelope({content: cids[recipients.length -1 ], timestamp:block.timestamp});
        outbox[msg.sender].push(
            sentMessage({
                recipients: recipients,
                contentData: outboxContent
            })
        );

    }

    function getKey(address account) public view returns (string memory) {
        return publicKeys[account];
    }

    function fetchMessages(address to, address from)
        public
        view
        returns (Envelope[] memory)
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
