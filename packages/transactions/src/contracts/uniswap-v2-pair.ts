import { ethers } from 'ethers';

export class UniswapV2Pair {
  static ABI = [
    // ... (truncated for brevity, add all methods/events from your provided ABI)
    { "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "spender", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "from", "type": "address" }, { "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "factory", "outputs": [{ "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "token0", "outputs": [{ "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "token1", "outputs": [{ "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    {
      "inputs": [], "name": "getReserves", "outputs": [
        { "name": "reserve0", "type": "uint112" },
        { "name": "reserve1", "type": "uint112" },
        { "name": "blockTimestampLast", "type": "uint32" }
      ], "stateMutability": "view", "type": "function"
    },
    // ... add more methods/events as needed
  ];

  public contract: ethers.Contract;

  constructor(address: string, providerOrSigner: ethers.Signer | ethers.providers.Provider) {
    this.contract = new ethers.Contract(address, UniswapV2Pair.ABI, providerOrSigner);
  }

  static getAbi() {
    return UniswapV2Pair.ABI;
  }
} 