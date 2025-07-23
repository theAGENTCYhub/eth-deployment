// const dotenv = require('dotenv');

// dotenv.config();
import { config as dotenvConfig } from 'dotenv'; // what a hack
dotenvConfig();

export const config = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	NETWORK: process.env.NETWORK || 'hardhat',
	HARDHAT_RPC: process.env.HARDHAT_RPC || 'http://localhost:8545',
	SEPOLIA_RPC: process.env.SEPOLIA_RPC,
	MAINNET_RPC: process.env.MAINNET_RPC,
	DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
	// its the hardhat publicly known private key
} as const;

// Network-specific validation
if (config.NETWORK === 'sepolia' && !config.SEPOLIA_RPC) {
	throw new Error('SEPOLIA_RPC is required when NETWORK=sepolia');
}
if (config.NETWORK === 'mainnet' && !config.MAINNET_RPC) {
	throw new Error('MAINNET_RPC is required when NETWORK=mainnet');
}

