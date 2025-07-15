import dotenv from 'dotenv';

/**
 * ## ENV Variables
 * 
 * Available ENV Variables:
 ** - BOT_TOKEN
 ** - NODE_ENV
 ** - NETWORK
 ** - HARDHAT_RPC
 ** - SEPOLIA_RPC
 ** - MAINNET_RPC
 ** - DEPLOYER_PRIVATE_KEY
 * 
 * These may change in the future
 */



dotenv.config();



export const config = {

    // Bot configuration
    BOT_TOKEN: process.env.BOT_TOKEN!,

    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Network configuration
    NETWORK: process.env.NETWORK || 'hardhat', // hardhat, sepolia, mainnet

    // RPC URLs
    HARDHAT_RPC: process.env.HARDHAT_RPC || 'http://localhost:8545',
    SEPOLIA_RPC: process.env.SEPOLIA_RPC!,
    MAINNET_RPC: process.env.MAINNET_RPC!,

    // Private keys (for testing - in production use proper key management)
    DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY!,
} as const;



// Validate required environment variables
const requiredVars = ['BOT_TOKEN'];
for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Network-specific validation
if (config.NETWORK === 'sepolia' && !config.SEPOLIA_RPC) {
    throw new Error('SEPOLIA_RPC is required when NETWORK=sepolia');
}


if (config.NETWORK === 'mainnet' && !config.MAINNET_RPC) {
    throw new Error('MAINNET_RPC is required when NETWORK=mainnet');
}