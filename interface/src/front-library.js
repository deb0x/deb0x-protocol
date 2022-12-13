import { ethers, BigNumber } from "ethers";
import deb0x from "./ethereum/deb0x";
import deb0xERC20 from "./ethereum/deb0xerc20";
// import forwarder from "./ethereum/forwarder";
import deb0xViews from "./ethereum/deb0xViews";
import { getKey } from "./ethereum/EventLogs";
import ethUtil from 'ethereumjs-util';
import { create } from 'ipfs-http-client';
import { encrypt } from '@metamask/eth-sig-util';
import { convertStringToBytes32} from './ethereum/Converter.js';

const projectId = process.env.REACT_APP_PROJECT_ID;
const projectSecret = process.env.REACT_APP_PROJECT_SECRET;
const projectIdAndSecret = `${projectId}:${projectSecret}`;
const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(projectIdAndSecret).toString(
      'base64'
    )}`,
  },
});

export class FrontendLibrary {
    constructor(provider, deb0xAddress, deb0xERC20Address, deb0xViewsAddress) {
        this.provider = provider ?
            provider :
            new ethers.providers.JsonRpcProvider("https://polygon-rpc.com/");
        this.deb0xAddress = deb0xAddress;
        this.deb0xERC20Address = deb0xERC20Address;
        this.deb0xContract = deb0x(this.provider, this.deb0xAddress);
        this.deb0xERC20 = deb0xERC20(this.provider, this.deb0xERC20Address);
        // this.forwarder = forwarder(this.provider);
        this.deb0xViewsContract = deb0xViews(this.provider, deb0xViewsAddress);
        this.BSCProvider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com/');
    }

    async switchNetwork() {
        try {
            await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: "0x89"}],
            });            
        } catch (switchError) {
            try {
                await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: '0x89', 
                        chainName:'Polygon Network',
                        rpcUrls:['https://rpc-mainnet.maticvigil.com'],                   
                        blockExplorerUrls:['https://polygonscan.com/'],  
                        nativeCurrency: { 
                        symbol:'Matic',   
                        decimals: 18
                        }       
                    }
                    ]});
            } catch (err) {
                return err;
            }
        }
    }

    async isInitialized(address) {
        return await getKey(address);
    }

    isAddress(address) {
        return ethers.utils.isAddress(address);
    }

    async sendMessageTx(deb0xContract, recipients, cids) {
        let notification; 
        try {
            const overrides = 
                { value: ethers.utils.parseUnits("0.01", "ether"),
                    gasLimit:BigNumber.from("1000000") }
            const tx = await deb0xContract.send(recipients,
                cids,
                ethers.constants.AddressZero,
                0,
                0,
                overrides)
            await tx.wait()
                .then(() => {
                    notification = {
                        message: "Message was succesfully sent.",
                        open: true,
                        severity: "success"
                    }
                })
                .catch(() => {
                    notification = {
                        message: "Message couldn't be sent!",
                        open: true,
                        severity: "error"
                    }
                })
        } catch (error) {
            console.log(error)
            notification = {
                message: "You rejected the transaction. Message was not sent.",
                open: true,
                severity: "info"
            }
        }
        return notification;
    }

    async encryptText(messageToEncrypt, recipients, library)
    {
        let cids = [];
        recipients.push(await library.getAddress())

        for (let address of recipients) {
            const destinationAddressEncryptionKey = await getKey(address);
            const encryptedMessage = ethUtil.bufferToHex(
                Buffer.from(
                    JSON.stringify(
                        encrypt({
                            publicKey: destinationAddressEncryptionKey || '',
                            data: messageToEncrypt,
                            version: 'x25519-xsalsa20-poly1305'
                        }
                        )
                    ),
                    'utf8'
                )
            )
            const message = await client.add(encryptedMessage);
            cids.push(convertStringToBytes32(message.path))
        }

        return cids;
    }

    async fetchSendResult(request, url)
    {
        let notification;

        await fetch(url, {
            method: 'POST',
            body: JSON.stringify(request),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((response) => response.json())
            .then(async (data) => {
                try{
                    const {tx: txReceipt} = JSON.parse(data.result)
                    if(txReceipt.status === 1){
                        notification = {
                            message: "Message was succesfully sent.",
                            open: true,
                            severity: "success"
                        }
                    } else {
                        notification = {
                            message: "Message couldn't be sent!",
                            open: true,
                            severity: "error"
                        }
                    }
                } catch(error) {
                    if(data.status === "pending") {
                        notification = {
                            message: "Your transaction is pending. Your message should arrive shortly",
                            open: true,
                            severity: "info"
                        }
                    } else if(data.status === "error") {
                        notification = {
                            message: "Transaction relayer error. Please try again",
                            open: true,
                            severity: "error"
                        }
                    }
                }
                
            })
        
        return notification;
    }

}