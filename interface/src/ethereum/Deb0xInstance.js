import { ethers } from "ethers";
const { abi } = require("./Deb0x.json");

export function createInstance(provider) {
    return new ethers.Contract("0x168618bde8fa88cc23eadf35a6340a77e0affda7", abi, provider);
}