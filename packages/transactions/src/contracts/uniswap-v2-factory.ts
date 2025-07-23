import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from './contract-store';
import { config } from '../config/env';

export class UniswapV2Factory {
  static ABI = [
    {
      "inputs": [
        { "internalType": "address", "name": "tokenA", "type": "address" },
        { "internalType": "address", "name": "tokenB", "type": "address" }
      ],
      "name": "createPair",
      "outputs": [
        { "internalType": "address", "name": "pair", "type": "address" }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "tokenA", "type": "address" },
        { "internalType": "address", "name": "tokenB", "type": "address" }
      ],
      "name": "getPair",
      "outputs": [
        { "internalType": "address", "name": "pair", "type": "address" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
    // ... add more methods as needed
  ];

  static getAddress(network = config.NETWORK) {
    return CONTRACT_ADDRESSES[network]?.UniswapV2Factory;
  }

  public contract: ethers.Contract;

  constructor(providerOrSigner: ethers.Signer | ethers.providers.Provider, network = config.NETWORK) {
    const address = UniswapV2Factory.getAddress(network);
    if (!address) throw new Error(`No Uniswap V2 Factory address for network: ${network}`);
    this.contract = new ethers.Contract(address, UniswapV2Factory.ABI, providerOrSigner);
  }
} 