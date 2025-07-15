// src/index.ts
import { EthDeployerBot } from './bot/bot';
import { config } from './config/env';
import { web3Provider } from './web3/provider';

async function main() {
	console.log('🚀 Starting ETH Token Deployer...');
	console.log('==========================================');

	try {
		// Initialize and test web3 connection
		console.log('🔗 Initializing Web3 connection...');
		const networkConfig = web3Provider.getNetworkConfig();
		console.log(`📡 Connected to ${networkConfig.name} (Chain ID: ${networkConfig.chainId})`);

		// Test connection by getting current block
		const blockNumber = await web3Provider.getCurrentBlock();
		console.log(`📦 Current block: ${blockNumber}`);

		// Get deployer wallet info
		const wallet = web3Provider.getWallet();
		const balance = await web3Provider.getBalance();
		console.log(`💼 Deployer wallet: ${wallet.address}`);
		console.log(`💰 Balance: ${balance} ETH`);

		// Validate balance for deployments
		const balanceNum = parseFloat(balance);
		if (balanceNum < 0.001 && !networkConfig.name.includes('Hardhat')) {
			console.warn('⚠️  Warning: Low balance detected. You may need more ETH for deployments.');
		}

		console.log('==========================================');

		// Initialize and start the bot
		console.log('🤖 Initializing Telegram bot...');
		const bot = new EthDeployerBot();

		await bot.start();

		console.log('==========================================');
		console.log('✅ ETH Token Deployer is running!');
		console.log(`📱 Environment: ${config.NODE_ENV}`);
		console.log(`🌐 Network: ${config.NETWORK}`);
		console.log('Press Ctrl+C to stop the bot');
		console.log('==========================================');

	} catch (error) {
		console.error('❌ Failed to start application:', error);

		if (error instanceof Error) {
			if (error.message.includes('BOT_TOKEN')) {
				console.error('💡 Make sure BOT_TOKEN is set in your environment variables');
			} else if (error.message.includes('RPC')) {
				console.error('💡 Check your RPC URL configuration');
			} else if (error.message.includes('PRIVATE_KEY')) {
				console.error('💡 Make sure DEPLOYER_PRIVATE_KEY is set in your environment variables');
			}
		}

		process.exit(1);
	}
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error);
	process.exit(1);
});

// Start the application
main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});