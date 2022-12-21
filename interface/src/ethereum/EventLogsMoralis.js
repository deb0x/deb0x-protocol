import { CatchingPokemonSharp, ContactSupportOutlined } from '@mui/icons-material';
import axios from 'axios';
let { ethers } = require("ethers");
const Web3 = require('web3');
const web3 = new Web3();
const deb0xAddress = "0xA06735da049041eb523Ccf0b8c3fB9D36216c646";
let { convertBytes32ToString } = require('./Converter.js')

async function setKeyEvent(secondaryTopic) {

    let data = selectEvent('KeySet');

    const options = {
        method: 'GET',
        url: `https://deep-index.moralis.io/api/v2/${deb0xAddress}/logs`,
        params: {
            chain: 'polygon',
            from_block: '36051352',
            topic0: data.topic,
            topic1: secondaryTopic,
            limit: 500
        },
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'X-API-Key': '5QcYsvCGVDVUdkugsq85agwYqYOyo5i2QUGrNQrZszo28SkF65xqDBfVaiVrpQhb'
        },
        data: data.abi
    };

    let requestValue = await axios.request(options)
    return requestValue.data.result;
}

async function getAllEventsWithSecondaryTopic(secondaryTopic) {

    let data = selectEvent('Sent');

    const options = {
        method: 'GET',
        url: `https://deep-index.moralis.io/api/v2/${deb0xAddress}/logs`,
        params: {
            chain: 'polygon',
            from_block: '36051352',
            topic0: data.topic,
            topic1: secondaryTopic
        },
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'X-API-Key': '5QcYsvCGVDVUdkugsq85agwYqYOyo5i2QUGrNQrZszo28SkF65xqDBfVaiVrpQhb'
        },
        data: data.abi
    };

    let requestValue = await axios.request(options)

    return requestValue.data.result;
}

async function fetchMessagesWithSecondaryAndThirdTopic(secondaryTopic, thirdTopic) {

    let data = selectEvent('Sent');

    const options = {
        method: 'GET',
        url: `https://deep-index.moralis.io/api/v2/${deb0xAddress}/logs`,
        params: {
            chain: 'polygon',
            from_block: '36051352',
            topic0: data.topic,
            topic1: secondaryTopic,
            topic2: thirdTopic,
            limit: 500
        },
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'X-API-Key': '5QcYsvCGVDVUdkugsq85agwYqYOyo5i2QUGrNQrZszo28SkF65xqDBfVaiVrpQhb'
        },
        data: data.abi
    };

    let requestValue = await axios.request(options)
    return requestValue.data.result;
}

async function getSentMessageEvents(thirdTopic) {
    let data = selectEvent('Sent');

    const options = {
        method: 'GET',
        url: `https://deep-index.moralis.io/api/v2/${deb0xAddress}/logs`,
        params: {
            chain: 'polygon',
            from_block: '36051352',
            topic0: data.topic,
            topic2: thirdTopic,
            limit: 500
        },
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'X-API-Key': '5QcYsvCGVDVUdkugsq85agwYqYOyo5i2QUGrNQrZszo28SkF65xqDBfVaiVrpQhb'
        },
        data: data.abi
    };

    let requestValue = await axios.request(options)
    return requestValue.data;
}

function selectEvent(name) {
    let abi, topic;
    switch (name) {
        case 'Sent':
            topic = "0xa33bc9a10d8f3a335b59663beb6a02681748ac0b3db1251c7bb08f3e99dd0bb4";
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
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "sentId",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "bytes32[]",
                        "name": "content",
                        "type": "bytes32[]"
                    }
                ],
                "name": "Sent",
                "type": "event"
            }
            break;
        case 'KeySet':
            topic = "0x8e06b8416b712e88dc5bdfc009fcc4de46c26bf894cd73d9a855ceb8170ea78d";
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
                        "name": "value",
                        "type": "bytes32"
                    }
                ],
                "name": "KeySet",
                "type": "event"
            }

    }
    return { abi, topic };
}

export async function getKeyMoralis(to) {
    let secondaryTopics = '0x000000000000000000000000' + to.slice(2);
    let events = await setKeyEvent(secondaryTopics);
    if (events.length != 0) {
        for (let i = 0; i < events.length; i++) {
            if (events[i].topic1.toLowerCase() === secondaryTopics.toLowerCase()) {
                return ethers.utils.base64.encode(ethers.utils.arrayify(events[i].topic2));
            } else {
                return '';
            }
        }
    } else
        return '';
}

export async function fetchMessageSendersMoralis(account) {
    let secondaryTopics = '0x000000000000000000000000' + account.slice(2);
    let events = [];
    events = await getAllEventsWithSecondaryTopic(secondaryTopics);
    let newEvents = events;
    let messageSenders = newEvents.filter(element => (element.topic1.toLowerCase() === secondaryTopics.toLowerCase()) &&
        (secondaryTopics.toLowerCase() != element.topic2.toLowerCase())).map(element => '0x' + element.topic2.slice(26));
    return messageSenders
}

export async function fetchMessagesMoralis(to, from) {
    let secondaryTopic = '0x000000000000000000000000' + to.slice(2);
    let thirdTopic = '0x000000000000000000000000' + from.slice(2);
    let events = [];
    events = await fetchMessagesWithSecondaryAndThirdTopic(secondaryTopic, thirdTopic);
    const typesArray = [
        { type: 'uint256', name: 'sentId' },
        { type: 'uint256', name: 'timestamp' },
        { type: 'bytes32[]', name: 'content' },
    ];
    let returnedData = [];
    let argumentsArray = [];
    let contentValue = '';
    for (let i = 0; i < events.length; i++) {
        let dataAboutEvent = web3.eth.abi.decodeParameters(typesArray, events[i].data);
        argumentsArray.push(ethers.utils.arrayify(dataAboutEvent[2][0]))
        argumentsArray.push(ethers.utils.arrayify(ethers.utils.stripZeros(dataAboutEvent[2][1])))
        contentValue = convertBytes32ToString(argumentsArray);
        returnedData.push({ "content": contentValue, "timestamp": dataAboutEvent[1] });
        argumentsArray = [];
        contentValue = '';
    }
    return returnedData;
}

export async function fetchSentMessagesMoralis(from) {
    let thirdTopic = '0x000000000000000000000000' + from.slice(2);
    let events = [];
    let respond = await getSentMessageEvents(thirdTopic);
    events = respond.result;
    const typesArray = [
        { type: 'uint256', name: 'sentId' },
        { type: 'uint256', name: 'timestamp' },
        { type: 'bytes32[]', name: 'content' },
    ];
    let mapForRecipients = new Map();
    let mapForEnvelope = new Map();
    let argumentsArray = [];
    let contentValue = '';
    for (let i = 0; i < events.length; i++) {
        let dataAboutEvent = web3.eth.abi.decodeParameters(typesArray, events[i].data);
        argumentsArray.push(ethers.utils.arrayify(dataAboutEvent[2][0]))
        argumentsArray.push(ethers.utils.arrayify(ethers.utils.stripZeros(dataAboutEvent[2][1])))
        contentValue = convertBytes32ToString(argumentsArray);
        if (mapForRecipients.has(dataAboutEvent[0])) {
            let value = mapForRecipients.get(dataAboutEvent[0]);
            value.push('0x' + events[i].topic1.slice(26));
            mapForRecipients.set(dataAboutEvent[0], value);
            if (events[i].topic1.toLowerCase() === thirdTopic.toLowerCase()) {
                mapForEnvelope.set(dataAboutEvent[0], { "timestamp": dataAboutEvent[1], "content": contentValue })
            }
        } else {
            mapForRecipients.set(dataAboutEvent[0], ['0x' + events[i].topic1.slice(26)])
            if (events[i].topic1.toLowerCase() === thirdTopic.toLowerCase()) {
                mapForEnvelope.set(dataAboutEvent[0], { "timestamp": dataAboutEvent[1], "content": contentValue })
            }
        }
        argumentsArray = [];
        contentValue = '';
    }
    let arrayOfRecipients = [];
    let arrrayOfEnvelope = [];
    let allData = [];
    arrayOfRecipients = Array.from(mapForRecipients.values());
    for (const [key, value] of mapForEnvelope) {
        arrrayOfEnvelope.push({ "content": value.content, "timestamp": value.timestamp });
    }
    for (let i = 0; i < arrayOfRecipients.length; i++) {
        allData[i] = [
            [{ "recipients": arrayOfRecipients[i] }],
            [{ "contentData": arrrayOfEnvelope[i] }]
        ];
    }
    return allData;
}