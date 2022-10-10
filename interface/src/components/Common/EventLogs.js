import axios from 'axios';

async function getEvents() {
    const options = {
        method: 'GET',
        url: 'https://deep-index.moralis.io/api/v2/0xeB4cfF7410f8839a77d81d90562EDC3728e6faA3/logs',
        params: { chain: 'goerli' },
        headers: { accept: 'application/json', 'X-API-Key': 'test' }
    };

    axios
        .request(options)
        .then(function(response) {
            console.log(response.data);
        })
        .catch(function(error) {
            console.error(error);
        });
}