import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from './contract-store';
import { config } from '../config/env';

export class UniswapV2Router {
    static ABI = [
        // Add liquidity ETH
        {
            "inputs": [
                { "internalType": "address", "name": "token", "type": "address" },
                { "internalType": "uint256", "name": "amountTokenDesired", "type": "uint256" },
                { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" },
                { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" },
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "deadline", "type": "uint256" }
            ],
            "name": "addLiquidityETH",
            "outputs": [
                { "internalType": "uint256", "name": "amountToken", "type": "uint256" },
                { "internalType": "uint256", "name": "amountETH", "type": "uint256" },
                { "internalType": "uint256", "name": "liquidity", "type": "uint256" }
            ],
            "stateMutability": "payable",
            "type": "function"
        },
        // Add liquidity
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
        // Remove liquidity ETH
        {
            "inputs": [
                { "internalType": "address", "name": "token", "type": "address" },
                { "internalType": "uint256", "name": "liquidity", "type": "uint256" },
                { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" },
                { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" },
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "deadline", "type": "uint256" }
            ],
            "name": "removeLiquidityETH",
            "outputs": [
                { "internalType": "uint256", "name": "amountToken", "type": "uint256" },
                { "internalType": "uint256", "name": "amountETH", "type": "uint256" }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        // Remove liquidity
        {
            "inputs": [
                { "internalType": "address", "name": "tokenA", "type": "address" },
                { "internalType": "address", "name": "tokenB", "type": "address" },
                { "internalType": "uint256", "name": "liquidity", "type": "uint256" },
                { "internalType": "uint256", "name": "amountAMin", "type": "uint256" },
                { "internalType": "uint256", "name": "amountBMin", "type": "uint256" },
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "deadline", "type": "uint256" }
            ],
            "name": "removeLiquidity",
            "outputs": [
                { "internalType": "uint256", "name": "amountA", "type": "uint256" },
                { "internalType": "uint256", "name": "amountB", "type": "uint256" }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        // Swap exact ETH for tokens
        {
            "inputs": [
                { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
                { "internalType": "address[]", "name": "path", "type": "address[]" },
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "deadline", "type": "uint256" }
            ],
            "name": "swapExactETHForTokens",
            "outputs": [
                { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
            ],
            "stateMutability": "payable",
            "type": "function"
        },
        // Swap exact ETH for tokens (supporting fee on transfer)
        {
            "inputs": [
                { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
                { "internalType": "address[]", "name": "path", "type": "address[]" },
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "deadline", "type": "uint256" }
            ],
            "name": "swapExactETHForTokensSupportingFeeOnTransferTokens",
            "outputs": [
                { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
            ],
            "stateMutability": "payable",
            "type": "function"
        },
        // Swap exact tokens for ETH
        {
            "inputs": [
                { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
                { "internalType": "address[]", "name": "path", "type": "address[]" },
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "deadline", "type": "uint256" }
            ],
            "name": "swapExactTokensForETH",
            "outputs": [
                { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        // Swap exact tokens for ETH (supporting fee on transfer)
        {
            "inputs": [
                { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
                { "internalType": "address[]", "name": "path", "type": "address[]" },
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "deadline", "type": "uint256" }
            ],
            "name": "swapExactTokensForETHSupportingFeeOnTransferTokens",
            "outputs": [
                { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        // Get amounts out
        {
            "inputs": [
                { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                { "internalType": "address[]", "name": "path", "type": "address[]" }
            ],
            "name": "getAmountsOut",
            "outputs": [
                { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        // Get amounts in
        {
            "inputs": [
                { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
                { "internalType": "address[]", "name": "path", "type": "address[]" }
            ],
            "name": "getAmountsIn",
            "outputs": [
                { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
            ],
            "stateMutability": "view",
            "type": "function"
        }
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