import axios from 'axios';

const deb0xAddress = "0xB693E0698cC7d2Bd4Bb4AC390F34A506E146e5D3";

async function getData(eventName) {

    let data = selectEvent(eventName);

    const options = {
        method: 'POST',
        url: `https://deep-index.moralis.io/api/v2/${deb0xAddress}/events`,
        params: {
            chain: 'goerli',
            topic: data.topic
        },
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'X-API-Key': 'test'
        },
        data: data.abi
    };

    let requestValue = await axios.request(options)
    return requestValue.data.result;
}

function selectEvent(name) {
    let abi, topic;
    switch (name) {
        case 'Sent':
            topic = "0xd255a04e9537ee418651bfdd3be3efed3b9f677f36ba9e488e0d27340c97961f";
            abi = {
                "anonymous": false,
                "inputs": [{
                        "indexed": true,
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "hash",
                        "type": "bytes32"
                    },
                    {
                        "components": [{
                                "internalType": "string",
                                "name": "content",
                                "type": "string"
                            },
                            {
                                "internalType": "uint256",
                                "name": "timestamp",
                                "type": "uint256"
                            }
                        ],
                        "indexed": false,
                        "internalType": "struct Deb0xCore.Envelope",
                        "name": "body",
                        "type": "tuple"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "sentId",
                        "type": "uint256"
                    }
                ],
                "name": "Sent",
                "type": "event"
            };
            break;
        case 'KeySet':
            topic = "0x1db169902a3b228ab764219bfc023384698a05b8a3d1bd2e046867a1dedf78a9";
            abi = {
                "anonymous": false,
                "inputs": [{
                        "indexed": true,
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "hash",
                        "type": "bytes32"
                    },
                    {
                        "indexed": false,
                        "internalType": "string",
                        "name": "value",
                        "type": "string"
                    }
                ],
                "name": "KeySet",
                "type": "event"
            }
            break;
        case 'FrontEndFeesClaimed':
            topic = "";
            abi = {
                "anonymous": false,
                "inputs": [{
                        "indexed": true,
                        "internalType": "address",
                        "name": "userAddress",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "fees",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "cycle",
                        "type": "uint256"
                    }
                ],
                "name": "FrontEndFeesClaimed",
                "type": "event"
            }
            break;
        case 'FeesClaimed':
            topic = "";
            abi = {
                "anonymous": false,
                "inputs": [{
                        "indexed": true,
                        "internalType": "address",
                        "name": "userAddress",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "fees",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "cycle",
                        "type": "uint256"
                    }
                ],
                "name": "FeesClaimed",
                "type": "event"
            }
            break;
        case 'Staked':
            topic = "";
            abi = {
                "anonymous": false,
                "inputs": [{
                        "indexed": true,
                        "internalType": "address",
                        "name": "userAddress",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "cycle",
                        "type": "uint256"
                    }
                ],
                "name": "Staked",
                "type": "event"
            }
            break;
        case 'Unstaked':
            topic = "";
            abi = {
                "anonymous": false,
                "inputs": [{
                        "indexed": true,
                        "internalType": "address",
                        "name": "userAddress",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "cycle",
                        "type": "uint256"
                    }
                ],
                "name": "Unstaked",
                "type": "event"
            }
            break;
        case 'FrontEndRewardsClaimed':
            topic = "";
            abi = {
                "anonymous": false,
                "inputs": [{
                        "indexed": true,
                        "internalType": "address",
                        "name": "userAddress",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "anount",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "cycle",
                        "type": "uint256"
                    }
                ],
                "name": "FrontEndRewardsClaimed",
                "type": "event"
            }
            break;
        case 'RewardsClaimed':
            topic = "";
            abi = {
                "anonymous": false,
                "inputs": [{
                        "indexed": true,
                        "internalType": "address",
                        "name": "userAddress",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "anount",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "cycle",
                        "type": "uint256"
                    }
                ],
                "name": "RewardsClaimed",
                "type": "event"
            }
            break;
        case 'NewCycleStarted':
            topic = "";
            abi = {
                "anonymous": false,
                "inputs": [{
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "currentCycle",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "calculatedCycleReward",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "summedCycleStakes",
                        "type": "uint256"
                    }
                ],
                "name": "NewCycleStarted",
                "type": "event"
            }
    }
    return { abi, topic };
}

export async function fetchMessages(to, from) {
    let data = await getData("Sent");

    let messages = data.filter(data => data.data.to.toLowerCase() === to.toLowerCase() &&
        data.data.from.toLowerCase() === from.toLowerCase()).
    map(data => data.data.body);
    let returnedData = [];
    messages.forEach(message => returnedData.push({ "content": message[0], "timestamp": message[1] }))
    return returnedData;
}

export async function fetchMessageSenders(to) {
    let data = await getData("Sent");
    let messageSenders = data.filter(data => (data.data.to.toLowerCase() === to.toLowerCase()) && (data.data.to.toLowerCase() != data.data.from.toLowerCase())).map(data => data.data.from);
    return messageSenders;
}

export async function fetchSentMessages(sender) {
    let data = await getData("Sent");
    let mapForRecipients = new Map();
    let mapForEnvelope = new Map();
    data.forEach((event) => {
        if (event.data.from.toLowerCase() === sender.toLowerCase()) {
            if (mapForRecipients.has(event.data.sentId)) {
                let value = mapForRecipients.get(event.data.sentId);
                value.push(event.data.to);
                mapForRecipients.set(event.data.sentId, value);
                mapForEnvelope.set(event.data.sentId, event.data.body);
            } else {
                mapForRecipients.set(event.data.sentId, [event.data.to]);
            }
        }
    })
    let arrayOfRecipients = [];
    let arrrayOfEnvelope = [];
    let allData = [];

    arrayOfRecipients = Array.from(mapForRecipients.values());
    for (const [key, value] of mapForEnvelope) {
        arrrayOfEnvelope.push({ "content": value[0], "timestamp": value[1] });
    }
    for (let i = 0; i < arrayOfRecipients.length; i++) {
        allData[i] = [
            [{ "recipients": arrayOfRecipients[i] }],
            [{ "contentData": arrrayOfEnvelope[i] }]
        ];
    }
    return allData;
}

export async function getKey(account) {
    let data = await getData("KeySet");
    if (data.length != 0) {
        let value = data.filter(data => data.data.to.toLowerCase() === account.toLowerCase());
        if (value.length != 0) {
            return value[0].data.value;
        } else {
            return '';
        }
    } else
        return '';
}