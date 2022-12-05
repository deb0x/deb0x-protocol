import { CompressOutlined } from '@mui/icons-material';
let { convertBytes32ToString } = require('./Converter.js')
let { ethers } = require("ethers");
const Web3 = require('web3');
const web3 = new Web3();

const APIKEY = 'ckey_b065aa22fc1e4b68a13efab2521';
const baseURL = 'https://api.covalenthq.com/v1'
const blockchainChainId = '137'
const sentEventTopic = '0xa33bc9a10d8f3a335b59663beb6a02681748ac0b3db1251c7bb08f3e99dd0bb4';
const startBlock = '35637731';
const endBlock = 'latest';
const contractAddress = '0x3a473a59820929D42c47aAf1Ea9878a2dDa93E18';

async function getEvents(secondaryTopicsData) {
    const url = new URL(`${baseURL}/${blockchainChainId}/events/topics/${sentEventTopic}/?quote-currency=USD&format=JSON&starting-block=${startBlock}&ending-block=${endBlock}&sender-address=${contractAddress}&secondary-topics=${secondaryTopicsData}&key=${APIKEY}`);
    const response = await fetch(url);
    const result = await response.json();
    const data = result.data;
    return data;
}

const setKeyEventTopic = '0x8e06b8416b712e88dc5bdfc009fcc4de46c26bf894cd73d9a855ceb8170ea78d';
async function getSetKeyEvents(secondaryTopicsData) {
    const url = new URL(`${baseURL}/${blockchainChainId}/events/topics/${setKeyEventTopic}/?quote-currency=USD&format=JSON&starting-block=${startBlock}&ending-block=${endBlock}&sender-address=${contractAddress}&secondary-topics=${secondaryTopicsData}&key=${APIKEY}`);
    const response = await fetch(url);
    const result = await response.json();
    const data = result.data;
    return data;
}

async function getSentMessageEvents() {
    const url = new URL(`${baseURL}/${blockchainChainId}/events/topics/${sentEventTopic}/?quote-currency=USD&format=JSON&starting-block=${startBlock}&ending-block=${endBlock}&sender-address=${contractAddress}&key=${APIKEY}`);
    const response = await fetch(url);
    const result = await response.json();
    const data = result.data;
    return data;
}

export async function fetchMessageSenders(account) {
    let secondaryTopics = '0x000000000000000000000000' + account.slice(2);
    let events = await getEvents(secondaryTopics);
    let messageSenders = events.items.filter(element => (element.raw_log_topics[1].toLowerCase() === secondaryTopics.toLowerCase()) &&
        (secondaryTopics.toLowerCase() != element.raw_log_topics[2].toLowerCase())).map(element => '0x' + element.raw_log_topics[2].slice(26));
    return messageSenders
}

export async function fetchMessages(to, from) {
    let secondaryTopics = '0x000000000000000000000000' + to.slice(2);
    let events = await getEvents(secondaryTopics);
    let filterAfterFrom = '0x000000000000000000000000' + from.slice(2);
    let froms = events.items.filter(element => (filterAfterFrom.toLowerCase() === element.raw_log_topics[2].toLowerCase()));
    const typesArray = [
        { type: 'uint256', name: 'sentId' },
        { type: 'uint256', name: 'timestamp' },
        { type: 'bytes32[]', name: 'content' },
    ];
    let returnedData = [];
    let argumentsArray = [];
    let contentValue = '';
    for (let i = 0; i < froms.length; i++) {
        let dataAboutEvent = web3.eth.abi.decodeParameters(typesArray, froms[i].raw_log_data);
        argumentsArray.push(ethers.utils.arrayify(dataAboutEvent[2][0]))
        argumentsArray.push(ethers.utils.arrayify(ethers.utils.stripZeros(dataAboutEvent[2][1])))
        contentValue = convertBytes32ToString(argumentsArray);
        returnedData.push({ "content": contentValue, "timestamp": dataAboutEvent[1] });
        argumentsArray = [];
        contentValue = '';
    }
    return returnedData;
}
export async function fetchSentMessages(sender) {
    let secondaryTopics = '0x000000000000000000000000' + sender.slice(2);
    let events = await getSentMessageEvents();
    const typesArray = [
        { type: 'uint256', name: 'sentId' },
        { type: 'uint256', name: 'timestamp' },
        { type: 'bytes32[]', name: 'content' },
    ];
    let mapForRecipients = new Map();
    let mapForEnvelope = new Map();
    let filterAfterFrom = '0x000000000000000000000000' + sender.slice(2);
    let froms = events.items.filter(element => (filterAfterFrom.toLowerCase() === element.raw_log_topics[2].toLowerCase()));
    let argumentsArray = [];
    let contentValue = '';
    for (let i = 0; i < froms.length; i++) {
        let dataAboutEvent = web3.eth.abi.decodeParameters(typesArray, froms[i].raw_log_data);
        argumentsArray.push(ethers.utils.arrayify(dataAboutEvent[2][0]))
        argumentsArray.push(ethers.utils.arrayify(ethers.utils.stripZeros(dataAboutEvent[2][1])))
        contentValue = convertBytes32ToString(argumentsArray);

        if (froms[i].raw_log_topics[2].toLowerCase() === secondaryTopics.toLowerCase()) {
            if (mapForRecipients.has(dataAboutEvent[0])) {
                let value = mapForRecipients.get(dataAboutEvent[0]);
                value.push('0x' + froms[i].raw_log_topics[1].slice(26));
                mapForRecipients.set(dataAboutEvent[0], value);
                mapForEnvelope.set(dataAboutEvent[0], { "timestamp": dataAboutEvent[1], "content": contentValue })
            } else {
                mapForRecipients.set(dataAboutEvent[0], ['0x' + froms[i].raw_log_topics[1].slice(26)])
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

export async function getKey(to) {
    let secondaryTopics = '0x000000000000000000000000' + to.slice(2);
    console.log(secondaryTopics)
    let events = await getSetKeyEvents(secondaryTopics);
    console.log(events)
    if (events.items.length != 0) {
        for (let i = 0; i < events.items.length; i++) {
            if (events.items[i].raw_log_topics[1].toLowerCase() === secondaryTopics.toLowerCase()) {
                return ethers.utils.base64.encode(ethers.utils.arrayify(events.items[i].raw_log_topics[2]));
            } else {
                return '';
            }
        }
    } else
        return '';

}