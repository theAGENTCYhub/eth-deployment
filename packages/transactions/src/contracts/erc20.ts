import { ethers } from 'ethers';

export class ERC20 {
    static ABI = [
        { "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "type": "function" },
        { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" },
        { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
        { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        // ... add more methods as needed
    ];

    public contract: ethers.Contract;

    constructor(address: string, providerOrSigner: ethers.Signer | ethers.providers.Provider) {
        this.contract = new ethers.Contract(address, ERC20.ABI, providerOrSigner);
    }

    static getAbi() {
        return ERC20.ABI;
    }
} 