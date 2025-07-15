// src/web3/provider.ts
import { BigNumberish, ethers } from 'ethers';
import { config } from '../config/env';

export interface NetworkConfig {
	name: string;
	chainId: number;
	rpcUrl: string;
	isTestnet: boolean;
}

const NETWORKS: Record<string, NetworkConfig> = {
	hardhat: {
		name: 'Hardhat Local',
		chainId: 31337,
		rpcUrl: config.HARDHAT_RPC,
		isTestnet: true,
	},
	sepolia: {
		name: 'Sepolia Testnet',
		chainId: 11155111,
		rpcUrl: config.SEPOLIA_RPC,
		isTestnet: true,
	},
	mainnet: {
		name: 'Ethereum Mainnet',
		chainId: 1,
		rpcUrl: config.MAINNET_RPC,
		isTestnet: false,
	},
};


export class Web3Provider {
	private static instance: Web3Provider;
	private provider: ethers.providers.JsonRpcProvider;
	private wallet: ethers.Wallet;
	private networkConfig: NetworkConfig;

	private constructor() {
		this.networkConfig = NETWORKS[config.NETWORK];
		if (!this.networkConfig) {
			throw new Error(`Unsupported network: ${config.NETWORK}`);
		}

		this.provider = new ethers.providers.JsonRpcProvider(this.networkConfig.rpcUrl);
		this.wallet = new ethers.Wallet(config.DEPLOYER_PRIVATE_KEY, this.provider);
	}

	public static getInstance(): Web3Provider {
		if (!Web3Provider.instance) {
			Web3Provider.instance = new Web3Provider();
		}
		return Web3Provider.instance;
	}

	public getProvider(): ethers.providers.JsonRpcProvider {
		return this.provider;
	}

	public getWallet(): ethers.Wallet {
		return this.wallet;
	}

	public getNetworkConfig(): NetworkConfig {
		return this.networkConfig;
	}

	public async getBalance(address?: string): Promise<string> {
		const targetAddress = address || this.wallet.address;
		const balance = await this.provider.getBalance(targetAddress);
		return ethers.utils.formatEther(balance);
	}

	public async estimateGas(transaction: any): Promise<BigNumberish> {
		return await this.provider.estimateGas(transaction);
	}

	public async getCurrentBlock(): Promise<number> {
		return await this.provider.getBlockNumber();
	}

	// Helper method to check if we're on a testnet
	public isTestnet(): boolean {
		return this.networkConfig.isTestnet;
	}

	// Get network status for bot display
	public getNetworkStatus(): string {
		return `🌐 Network: ${this.networkConfig.name} (Chain ID: ${this.networkConfig.chainId})`;
	}
}

// Export singleton instance
export const web3Provider = Web3Provider.getInstance();