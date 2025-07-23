import { config } from '../config/env';

// Central contract store for all networks
export const CONTRACT_ADDRESSES: Record<string, Record<string, string>> = {
    mainnet: {
        UniswapV2Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
        UniswapV2Router02: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        // WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Example
    },
    sepolia: {
        UniswapV2Factory: '0xF62c03E08ada871A0bEb309762E260a7a6a880E6',
        UniswapV2Router02: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3',
    },
    hardhat: {
        UniswapV2Factory: '0xYourLocalFactoryAddress',
        UniswapV2Router02: '0xYourLocalRouterAddress',
    },
    // Add more networks as needed
};

export function getContractAddress(contractName: string, network?: string): string | undefined {
    const net = network || config.NETWORK;
    return CONTRACT_ADDRESSES[net]?.[contractName];
}

export function registerContractAddress(contractName: string, address: string, network?: string) {
    const net = network || config.NETWORK;
    if (!CONTRACT_ADDRESSES[net]) CONTRACT_ADDRESSES[net] = {};
    CONTRACT_ADDRESSES[net][contractName] = address;
} 