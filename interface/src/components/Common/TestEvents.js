const Web3 = require('web3');
const web3 = new Web3();

const APIKEY = 'ckey_b065aa22fc1e4b68a13efab2521';
const baseURL = 'https://api.covalenthq.com/v1'
const blockchainChainId = '137'
const sentEventTopic = '0x30292b34f392337af6a42d59615abadbf77da5245b82b2246293c759a9b9361e';
const startBlock = '34695814';
const endBlock = 'latest';
const contractAddress = '0xdF7E7f4C0B8AfaF67F706d4b80cfFC4532f46Fa4';

async function getEvents(secondaryTopicsData) {
    const secondaryTopics = secondaryTopicsData;
    const url = new URL(`${baseURL}/${blockchainChainId}/events/topics/${sentEventTopic}/?quote-currency=USD&format=JSON&starting-block=${startBlock}&ending-block=${endBlock}&sender-address=${contractAddress}&secondary-topics=${secondaryTopics}&key=${APIKEY}`);
    const response = await fetch(url);
    const result = await response.json();
    const data = result.data;
    return data;
}

export async function fetchMessageSendersTest(account) {
    let secondaryTopics = '0x000000000000000000000000' + account.slice(2);
    let events = await getEvents(secondaryTopics);
    let messageSenders = events.items.filter(element => (element.raw_log_topics[1].toLowerCase() === secondaryTopics.toLowerCase()) &&
        (secondaryTopics.toLowerCase() != element.raw_log_topics[2].toLowerCase())).map(element => '0x' + element.raw_log_topics[2].slice(26));
    return messageSenders
}

export async function fetchMessagesTest(to, from) {
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