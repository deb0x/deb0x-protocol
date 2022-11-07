import { CompressOutlined } from '@mui/icons-material';

const Web3 = require('web3');
const web3 = new Web3();

const APIKEY = 'ckey_b065aa22fc1e4b68a13efab2521';
const baseURL = 'https://api.covalenthq.com/v1'
const blockchainChainId = '137'
const sentEventTopic = '0x30292b34f392337af6a42d59615abadbf77da5245b82b2246293c759a9b9361e';
const startBlock = '35113469';
const endBlock = 'latest';
const contractAddress = '0xdF7E7f4C0B8AfaF67F706d4b80cfFC4532f46Fa4';

async function getEvents(secondaryTopicsData) {
    const url = new URL(`${baseURL}/${blockchainChainId}/events/topics/${sentEventTopic}/?quote-currency=USD&format=JSON&starting-block=${startBlock}&ending-block=${endBlock}&sender-address=${contractAddress}&secondary-topics=${secondaryTopicsData}&key=${APIKEY}`);
    const response = await fetch(url);
    const result = await response.json();
    const data = result.data;
    return data;
}

const setKeyEventTopic = '0x1db169902a3b228ab764219bfc023384698a05b8a3d1bd2e046867a1dedf78a9';
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
        { type: 'string', name: 'content' },
    ];
    let returnedData = [];
    for (let i = 0; i < froms.length; i++) {
        let dataAboutEvent = web3.eth.abi.decodeParameters(typesArray, froms[i].raw_log_data);
        returnedData.push({ "content": dataAboutEvent[2], "timestamp": dataAboutEvent[1] });
    }
    return returnedData;
}
export async function fetchSentMessages(sender) {
    let secondaryTopics = '0x000000000000000000000000' + sender.slice(2);
    let events = await getSentMessageEvents();
    const typesArray = [
        { type: 'uint256', name: 'sentId' },
        { type: 'uint256', name: 'timestamp' },
        { type: 'string', name: 'content' },
    ];
    let mapForRecipients = new Map();
    let mapForEnvelope = new Map();
    let filterAfterFrom = '0x000000000000000000000000' + sender.slice(2);
    let froms = events.items.filter(element => (filterAfterFrom.toLowerCase() === element.raw_log_topics[2].toLowerCase()));
    for (let i = 0; i < froms.length; i++) {
        let dataAboutEvent = web3.eth.abi.decodeParameters(typesArray, froms[i].raw_log_data);
        if (froms[i].raw_log_topics[2].toLowerCase() === secondaryTopics.toLowerCase()) {
            if (mapForRecipients.has(dataAboutEvent[0])) {
                let value = mapForRecipients.get(dataAboutEvent[0]);
                value.push('0x' + froms[i].raw_log_topics[1].slice(26));
                mapForRecipients.set(dataAboutEvent[0], value);
                mapForEnvelope.set(dataAboutEvent[0], { "timestamp": dataAboutEvent[1], "content": dataAboutEvent[2] })
            } else {
                mapForRecipients.set(dataAboutEvent[0], ['0x' + froms[i].raw_log_topics[1].slice(26)])
            }
        }
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
    let events = await getSetKeyEvents(secondaryTopics);
    const typesArray = [
        { type: 'string', name: 'value' },
    ];
    if (events.items.length != 0) {
        for (let i = 0; i < events.items.length; i++) {
            if (events.items[i].raw_log_topics[1].toLowerCase() === secondaryTopics.toLowerCase()) {
                let dataFromEvent = web3.eth.abi.decodeParameters(typesArray, events.items[i].raw_log_data);
                return dataFromEvent[0];
            } else {
                return '';
            }
        }
    } else
        return '';

}