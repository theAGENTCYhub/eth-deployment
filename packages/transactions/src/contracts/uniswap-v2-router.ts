import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from './contract-store';
import { config } from '../config/env';

export class UniswapV2Router {
    static ABI = [
        // ... (truncated ABI, add more as needed)
        {
            "inputs": [
                { "internalType": "address", "name": "tokenA", "type": "address" },
                { "internalType": "address", "name": "tokenB", "type": "address" },
                { "internalType": "uint256", "name": "amountADesired", "type": "uint256" },
                { "internalType": "uint256", "name": "amountBDesired", "type": "uint256" },
                { "internalType": "uint256", "name": "amountAMin", "type": "uint256" },
                { "internalType": "uint256", "name": "amountBMin", "type": "uint256" },
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "deadline", "type": "uint256" }
            ],
            "name": "addLiquidity",
            "outputs": [
                { "internalType": "uint256", "name": "amountA", "type": "uint256" },
                { "internalType": "uint256", "name": "amountB", "type": "uint256" },
                { "internalType": "uint256", "name": "liquidity", "type": "uint256" }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        // ... add more methods as needed
    ];

    static getAddress(network = config.NETWORK) {
        return CONTRACT_ADDRESSES[network]?.UniswapV2Router02;
    }

    public contract: ethers.Contract;

    constructor(providerOrSigner: ethers.Signer | ethers.providers.Provider, network = config.NETWORK) {
        const address = UniswapV2Router.getAddress(network);
        if (!address) throw new Error(`No Uniswap V2 Router address for network: ${network}`);
        this.contract = new ethers.Contract(address, UniswapV2Router.ABI, providerOrSigner);
    }
} 