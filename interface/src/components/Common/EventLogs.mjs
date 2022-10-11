import axios from 'axios';

async function getFetchMessagesEvents() {
    let abi = {
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
            }
        ],
        "name": "Sent",
        "type": "event"
    };

    const options = {
        method: 'POST',
        url: 'https://deep-index.moralis.io/api/v2/0xeB4cfF7410f8839a77d81d90562EDC3728e6faA3/events',
        params: {
            chain: 'goerli',
            topic: '0x66dd7e98380c788629fa11caec71d64cd699c90624ee0a01ebb578fc73c2e796'
        },
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'X-API-Key': 'test'
        },
        data: abi
    };

    let requestValue = await axios.request(options)
    return requestValue.data.result;
}

export async function fetchMessages(to, from) {
    let data = await getFetchMessagesEvents();

    let messages = data.filter(data => data.data.to.toLowerCase() === to.toLowerCase() &&
        data.data.from.toLowerCase() === from.toLowerCase()).
    map(data => data.data.body);
    let returnedData = [];
    messages.forEach(message => returnedData.push({ "content": message[0], "timestamp": message[1] }))
    return returnedData;
}

export async function fetchMessageSenders(to) {
    let data = await getFetchMessagesEvents();

    let messageSenders = data.filter(data => data.data.to.toLowerCase() === to.toLowerCase()).map(data => data.data.from);
    return messageSenders;
}

export async function fetchSentMessages(sender) {
    let data = await getFetchMessagesEvents();
    let sentMessages = data.filter(data => data.data.from.toLowerCase() === sender.toLowerCase()).map(data => data.data);
    console.log(sentMessages);
    let hashArray = [];
    let recipientsArray = [{ "hash": "", "reciepients": [] }];
    for (let i = 0; i < sentMessages.length; i++) {
        if (!hashArray.includes(sentMessages[i].hash)) {
            hashArray.push(sentMessages[i].hash);
            recipientsArray.push(sentMessages[i].hash, sentMessages[i].to)
        } else {
            let index = recipientsArray.findIndex(data => data.hash.toLowerCase() === sentMessages[i].hash.toLowerCase());
            recipientsArray[index].push(sentMessages[i].to);
        }
    }
    console.log("HERE ");
    console.log(recipientsArray["0x67519d9cb6fdb4fa5534be78268476d15c661a845f9a63a43025d5bdaa769ecc"]);
    let returnedData = [];
    let recipients = []
    sentMessages.forEach(message => returnedData.push([{ "recipients": recipients.push(message.from), "contetnData": message.body }]))
    return returnedData;
}

fetchSentMessages("0xC533efcd190c8D6BdBf67bC6F24021Bf00eD865E")

async function getKeySetEvents() {
    let abi = {
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

    const options = {
        method: 'POST',
        url: 'https://deep-index.moralis.io/api/v2/0xeB4cfF7410f8839a77d81d90562EDC3728e6faA3/events',
        params: {
            chain: 'goerli',
            topic: '0x1db169902a3b228ab764219bfc023384698a05b8a3d1bd2e046867a1dedf78a9'
        },
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'X-API-Key': 'test'
        },
        data: abi
    };

    let requestValue = await axios.request(options)
    return requestValue.data.result;
}

export async function getKey(account) {
    let data = await getKeySetEvents();
    let value = data.filter(data => data.data.to.toLowerCase() === account.toLowerCase());
    return value[0].data.value;
}