import { ethers } from 'ethers';
import { config } from '../config/env';

// Select RPC URL based on environment
function getRpcUrl(): string {
    switch (config.NETWORK) {
        case 'mainnet':
            if (!config.MAINNET_RPC) throw new Error('MAINNET_RPC is not set');
            return config.MAINNET_RPC;
        case 'sepolia':
            if (!config.SEPOLIA_RPC) throw new Error('SEPOLIA_RPC is not set');
            return config.SEPOLIA_RPC;
        case 'hardhat':
        default:
            return config.HARDHAT_RPC;
    }
}

export const provider = new ethers.providers.JsonRpcProvider(getRpcUrl()); 