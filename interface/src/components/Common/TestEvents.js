// import { Contract, ethers } from "ethers";
// import { createInstance } from "../../ethereum/Deb0xInstance"
// let customHttpProvider = new ethers.providers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/c4174820658a4db9a6e5d54efec43ede");
// export async function getEvents() {
//     let contract = createInstance(customHttpProvider);
//     let filter = contract.filters.Sent(null, "0x7499dBA6CB815846E037F25aAA0223e97C941d13")
//     const startBlock = 34695814;
//     const endBlock = await customHttpProvider.getBlockNumber();
//     let allEvents = [];
//     for (let i = startBlock; i < endBlock; i += 3500) {
//         const _startBlock = i;
//         const _endBlock = Math.min(endBlock, i + 3499);
//         const events = await contract.queryFilter(filter, _startBlock, _endBlock);
//         allEvents = [...allEvents, ...events]
//     }

//     console.log(allEvents);

// }

//Covalent implrementation
const Web3 = require('web3');
const web3 = new Web3();

const APIKEY = 'ckey_b065aa22fc1e4b68a13efab2521';
const baseURL = 'https://api.covalenthq.com/v1'
const blockchainChainId = '137'
const sentEventTopic = '0xd255a04e9537ee418651bfdd3be3efed3b9f677f36ba9e488e0d27340c97961f';
const startBlock = '34695814';
const endBlock = 'latest';
const contractAddress = '0x168618bde8fa88cc23eadf35a6340a77e0affda7';

async function getEvents(secondaryTopicsData) {
    const secondaryTopics = secondaryTopicsData;
    const url = new URL(`${baseURL}/${blockchainChainId}/events/topics/${sentEventTopic}/?quote-currency=USD&format=JSON&starting-block=${startBlock}&ending-block=${endBlock}&sender-address=${contractAddress}&secondary-topics=${secondaryTopics}&key=${APIKEY}`);
    const response = await fetch(url);
    const result = await response.json();
    const data = result.data;
    return data;
}

// export async function filterEvents() {
//     let events = await getEvents();
//     const filteredEvents = events.items.filter(element =>
//         element.raw_log_topics[2].toString() === secondaryTopics.toString()
//     );

//     return filteredEvents;
// }

export async function fetchMessageSendersTest(account) {
    let secondaryTopics = '0x000000000000000000000000' + account.slice(2);
    let events = await getEvents(secondaryTopics);
    let messageSenders = events.items.filter(element => (element.raw_log_topics[1].toLowerCase() === secondaryTopics.toLowerCase()) &&
        (secondaryTopics.toLowerCase() != element.raw_log_topics[2].toLowerCase())).map(element => '0x' + element.raw_log_topics[2].slice(26));
    return messageSenders
}

// event Sent(
//     address indexed to,
//     address indexed from,
//     bytes32 indexed hash,
//     Envelope body,
//     uint256 sentId
// );
// string content;
// uint256 timestamp;
export async function fetchMessagesTest(to, from) {
    let secondaryTopics = '0x000000000000000000000000' + to.slice(2);
    let events = await getEvents(secondaryTopics);
    let data = events.items[0].raw_log_data;
    console.log(data);
    const decodedParameters = web3.eth.abi.decodeParameters({
        "to": 'address',
        "from": 'address',
        "hash": 'bytes32',
        "body": {
            "content": 'string',
            "timestamp": 'uint256'
        },
        "sentId": 'uint256'
    }, data);
    console.log(decodedParameters);
    //console.log(JSON.stringify(decodedParameters, null, 4));
    console.log(events)

}
// export async function fetchMessages(to, from) {
//     let data = await getData("Sent");
//     let messages = data.filter(data => data.data.to.toLowerCase() === to.toLowerCase() &&
//         data.data.from.toLowerCase() === from.toLowerCase()).
//     map(data => data.data.body);
//     let returnedData = [];
//     messages.forEach(message => returnedData.push({ "content": message[0], "timestamp": message[1] }))
//     return returnedData;
// }