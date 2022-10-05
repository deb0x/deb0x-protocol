const ethers = require('ethers');
const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');

const { ForwarderAbi } = require('../../src/forwarder');
const ForwarderAddress = require('../../interface/src/deploy.json').Forwarder;

async function relay(forwarder, typeHash, domainSeparator, request, signature, whitelist) {
  // Decide if we want to relay this request based on a whitelist
  const accepts = !whitelist || whitelist.includes(request.to);
  if (!accepts) throw new Error(`Rejected request to ${request.to}`);

  console.log("validating")
  // Validate request on the forwarder contract
  const valid = await forwarder.verify(request, domainSeparator, typeHash, '0x', signature);
  if (!valid) throw new Error(`Invalid request`);
  console.log("valid!")

  // Send meta-tx through relayer to the forwarder contract
  const gasLimit = (parseInt(request.gas) + 2000000).toString();
  const value = ethers.BigNumber.from("10000000000000000");
  return await forwarder.execute(request, domainSeparator, typeHash, '0x', signature, { gasLimit, value });
}

async function handler(event) {
  // Parse webhook payload
  if (!event.request || !event.request.body) throw new Error(`Missing payload`);
  const {typeHash, domainSeparator, signature, request } = event.request.body;
  console.log(typeHash, domainSeparator)
  console.log(`Relaying`, request);
  
  // Initialize Relayer provider and signer, and forwarder contract
  const credentials = { ... event };
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
  const forwarder = new ethers.Contract(ForwarderAddress, ForwarderAbi, signer);
  
  // Relay transaction!
  
  const tx = await relay(forwarder, typeHash, domainSeparator, request, signature);
  console.log(`Sent meta-tx: ${tx.hash}`);
  return { txHash: tx.hash };
}

module.exports = {
  handler,
  relay,
}