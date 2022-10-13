// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract Deb0xCore  is ERC2771Context {
    
    event Sent(address indexed to, address indexed from, bytes32 indexed hash, Envelope body,uint256 sentId);
    event KeySet(address indexed to, bytes32 indexed hash, string value);

    uint256 sentId;

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

    constructor(address forwarder)
    ERC2771Context(forwarder) {}

    function setKey(string memory publicKey) public {
        publicKeys[_msgSender()] = publicKey;
        bytes32 bodyHash= keccak256(abi.encodePacked(publicKey));
        emit KeySet(_msgSender(), bodyHash, publicKey);
    }
    
    function send(address[] memory recipients, string[] memory cids) public payable virtual {
        for (uint256 i = 0; i < recipients.length - 1; i++) {
            if (inbox[recipients[i]][_msgSender()].length == 0) {
                messageSenders[recipients[i]].push(_msgSender());
            }
            Envelope memory currentStruct = Envelope({content:cids[i], timestamp: block.timestamp});
            inbox[recipients[i]][_msgSender()].push(currentStruct);
            bytes32 bodyHash= keccak256(abi.encodePacked(cids[i]));
            emit Sent(recipients[i], _msgSender(), bodyHash, currentStruct,sentId);
        }
        Envelope memory currentStruct = Envelope({content:cids[recipients.length -1], timestamp: block.timestamp});
        bytes32 bodyHash= keccak256(abi.encodePacked(cids[recipients.length -1]));
        emit Sent(_msgSender(), _msgSender(), bodyHash, currentStruct,sentId);
        
        Envelope memory outboxContent = Envelope({content: cids[recipients.length -1 ], timestamp:block.timestamp});
        outbox[_msgSender()].push(
            sentMessage({
                recipients: recipients,
                contentData: outboxContent
            })
        );
        sentId++;
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
