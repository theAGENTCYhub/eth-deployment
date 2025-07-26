import { ethers } from 'ethers';
import type { ServiceResponse } from '../../types';
import type { BundleLaunchConfig } from '../launch/launch.service';
import {
	buildClogTransferTx,
	buildApproveRouterTx,
	buildOpenTradingV2Tx,
	buildExcludeFromFeeTx
} from '../../transactions/erc20.transaction';
import { buildUniswapCreatePairTx } from '../../transactions/uniswap-factory.transaction';
import { buildAddLiquidityETH, buildBuyTokensWithEth } from '../../transactions/uniswap-router.transaction';
import { buildEthTransferTx } from '../../transactions/eth.transaction';
import { generateBundleWallet, signTransaction, getNextNonce, calculateDeadline } from '../../utils/bundle-utils';
import { BundleCalculationService, type EqualTokenDistributionConfig } from './bundle-calculation.service';
import { config } from '../../config/env';

export interface BundleWallet {
	address: string;
	privateKey: string;
	index: number;
}

export interface BundleLaunchTransaction {
	type: string;
	description: string;
	transaction: ethers.PopulatedTransaction | ethers.providers.TransactionRequest;
	signedTransaction?: string;
	walletIndex?: number;
}

export interface BundleLaunchResult {
	bundleWallets: BundleWallet[];
	transactions: BundleLaunchTransaction[];
	signedTransactions: string[];
	buyTransactionHashes?: string[]; // Track which transactions are buy operations
	walletAmounts?: Array<{ walletIndex: number; ethAmount: bigint; expectedTokens: bigint }>; // Store ETH amounts for position creation
	pairAddress?: string;
	totalGasEstimate: string;
	devWalletPrivateKey: string;
	fundingWalletPrivateKey: string;
}

export class BundleOrchestrationService {
	private provider: ethers.providers.Provider;
	private devWallet: ethers.Wallet;
	private fundingWallet: ethers.Wallet;
	private bundleWallets: BundleWallet[] = [];
	private calculationService: BundleCalculationService;

	constructor(
		provider: ethers.providers.Provider,
		devWalletPrivateKey: string,
		fundingWalletPrivateKey: string
	) {
		this.provider = provider;
		this.devWallet = new ethers.Wallet(devWalletPrivateKey, provider);
		this.fundingWallet = new ethers.Wallet(fundingWalletPrivateKey, provider);
		this.calculationService = new BundleCalculationService();
	}

	/**
	 * Orchestrate the complete bundle launch process
	 */
	async orchestrateBundleLaunch(config: BundleLaunchConfig): Promise<ServiceResponse<BundleLaunchResult>> {
		try {
			const result: BundleLaunchResult = {
				bundleWallets: [],
				transactions: [],
				signedTransactions: [],
				totalGasEstimate: '0',
				devWalletPrivateKey: this.devWallet.privateKey,
				fundingWalletPrivateKey: this.fundingWallet.privateKey
			};

			// DEBUG: Log initial wallet information
			console.log('\n=== BUNDLE LAUNCH DEBUG INFO ===');
			console.log('[DEBUG] Dev wallet address:', this.devWallet.address);
			console.log('[DEBUG] Funding wallet address:', this.fundingWallet.address);
			
			const devWalletBalance = await this.provider.getBalance(this.devWallet.address);
			const fundingWalletBalance = await this.provider.getBalance(this.fundingWallet.address);
			const devWalletNonce = await this.provider.getTransactionCount(this.devWallet.address);
			const fundingWalletNonce = await this.provider.getTransactionCount(this.fundingWallet.address);
			
			console.log('[DEBUG] Dev wallet ETH balance:', ethers.utils.formatEther(devWalletBalance));
			console.log('[DEBUG] Funding wallet ETH balance:', ethers.utils.formatEther(fundingWalletBalance));
			console.log('[DEBUG] Dev wallet nonce:', devWalletNonce);
			console.log('[DEBUG] Funding wallet nonce:', fundingWalletNonce);
			console.log('================================\n');

			// Step 1: Generate bundle wallets
			console.log('Generating bundle wallets...');
			const bundleWallets = await this.generateBundleWallets(config.bundle_wallet_count);
			this.bundleWallets = bundleWallets;
			result.bundleWallets = bundleWallets;

			// Step 2: Get token decimals and calculate amounts
			const tokenContract = new ethers.Contract(
				config.tokenAddress,
				['function decimals() view returns (uint8)', 'function name() view returns (string)', 'function symbol() view returns (string)'],
				this.provider
			);
			const tokenDecimals = await tokenContract.decimals();
			const tokenName = await tokenContract.name();
			const tokenSymbol = await tokenContract.symbol();
			
			console.log('\n=== TOKEN INFO ===');
			console.log('[DEBUG] Token name:', tokenName);
			console.log('[DEBUG] Token symbol:', tokenSymbol);
			console.log('[DEBUG] Token decimals:', tokenDecimals);
			console.log('==================\n');
			
			const totalSupply = ethers.BigNumber.from(config.tokenTotalSupply);
			const tokensForClog = totalSupply.mul(100 - config.liquidity_token_percent).div(100);
			const tokensForLiquidity = totalSupply.sub(tokensForClog);
			
			// DEBUG: Log token amount calculations
			console.log('\n=== TOKEN AMOUNT CALCULATIONS ===');
			console.log('[DEBUG] Total supply (wei):', totalSupply.toString());
			console.log('[DEBUG] Total supply (tokens):', ethers.utils.formatUnits(totalSupply, tokenDecimals));
			console.log('[DEBUG] Liquidity token percent:', config.liquidity_token_percent + '%');
			console.log('[DEBUG] Tokens for clog (wei):', tokensForClog.toString());
			console.log('[DEBUG] Tokens for clog (tokens):', ethers.utils.formatUnits(tokensForClog, tokenDecimals));
			console.log('[DEBUG] Tokens for liquidity (wei):', tokensForLiquidity.toString());
			console.log('[DEBUG] Tokens for liquidity (tokens):', ethers.utils.formatUnits(tokensForLiquidity, tokenDecimals));
			console.log('[DEBUG] Liquidity ETH amount (wei):', config.liquidity_eth_amount);
			console.log('[DEBUG] Liquidity ETH amount (ETH):', ethers.utils.formatEther(config.liquidity_eth_amount));
			console.log('=====================================\n');
			
			// Calculate equal token distribution
			console.log('Calculating equal token distribution...');
			const equalDistributionConfig: EqualTokenDistributionConfig = {
				totalTokensToDistribute: totalSupply.mul(config.bundle_token_percent).div(100).toBigInt(),
				walletCount: config.bundle_wallet_count,
				tokenAddress: config.tokenAddress,
				wethAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH address
				routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
				signer: this.devWallet,
				maxIterations: 10,
				tolerance: BigInt(1000),
				// Pass actual liquidity amounts for theoretical calculation
				initialLiquidityEth: config.liquidity_eth_amount,
				initialLiquidityTokens: tokensForLiquidity.toString()
			};

			const equalDistributionResult = await this.calculationService.calculateEqualTokenDistribution(equalDistributionConfig);
			if (!equalDistributionResult.success || !equalDistributionResult.data) {
				return { success: false, error: `Failed to calculate equal token distribution: ${equalDistributionResult.error}` };
			}

			const realDevNonce = await this.provider.getTransactionCount(this.devWallet.address)

			const walletAmounts = equalDistributionResult.data.walletAmounts;
			console.log(`Equal token distribution calculated: ${walletAmounts.length} wallets`);
			result.walletAmounts = walletAmounts; // Store for position creation

			// Step 1: Build fund wallet transactions FIRST (so wallets have ETH for approve/buy)
			console.log('Building fund wallet transactions...');
			let fundingNonce = await getNextNonce(this.provider, this.fundingWallet.address);
			const fundTxs = await this.buildFundWalletTransactionsWithEqualDistribution(bundleWallets, walletAmounts, fundingNonce);
			result.transactions.push(...fundTxs);

			// Step 2: Build clog transfer transaction
			console.log('Building clog transfer transaction...');
			let devNonce = await getNextNonce(this.provider, this.devWallet.address);
			const clogTx = await this.buildClogTransfer(config.tokenAddress, tokensForClog, realDevNonce + 0);
			if (!clogTx.success || !clogTx.data) {
				return { success: false, error: `Failed to build clog transfer: ${clogTx.error}` };
			}
			result.transactions.push(clogTx.data);

			// Step 3: Build create pair transaction
			console.log('Building create pair transaction...');
			devNonce = await getNextNonce(this.provider, this.devWallet.address);
			const createPairTx = await this.buildCreatePair(config.tokenAddress, realDevNonce + 1);
			if (!createPairTx.success || !createPairTx.data) {
				return { success: false, error: `Failed to build create pair: ${createPairTx.error}` };
			}
			result.transactions.push(createPairTx.data);

			// Step 4: Build dev wallet approval for router (needed for add liquidity)
			console.log('Building dev wallet approval for router...');
			devNonce = await getNextNonce(this.provider, this.devWallet.address);
			const devApprovalTx = await this.buildDevWalletApproval(config.tokenAddress, realDevNonce + 2);
			if (!devApprovalTx.success || !devApprovalTx.data) {
				return { success: false, error: `Failed to build dev wallet approval: ${devApprovalTx.error}` };
			}
			result.transactions.push(devApprovalTx.data);

			// Step 5: Build add liquidity transaction
			console.log('Building add liquidity transaction...');
			devNonce = await getNextNonce(this.provider, this.devWallet.address);
			const addLiquidityTx = await this.buildAddLiquidity(
				config.tokenAddress,
				tokensForLiquidity,
				config.liquidity_eth_amount,
				realDevNonce + 3
			);
			if (!addLiquidityTx.success || !addLiquidityTx.data) {
				return { success: false, error: `Failed to build add liquidity: ${addLiquidityTx.error}` };
			}
			result.transactions.push(addLiquidityTx.data);

			// Step 6: Build open trading transaction (only if trading is not already open)
			console.log('Building open trading transaction...');
			devNonce = await getNextNonce(this.provider, this.devWallet.address);
			const openTradingTx = await this.buildOpenTrading(config.tokenAddress, realDevNonce + 4);
			if (!openTradingTx.success || !openTradingTx.data) {
				console.log('[DEBUG] Skipping openTradingV2 transaction due to error:', openTradingTx.error);
				// Don't fail the entire bundle, just skip this transaction
				console.log('[DEBUG] Continuing with bundle without openTradingV2...');
			} else {
				result.transactions.push(openTradingTx.data);
			}

			// Step 7: Build exclude from fee transactions
			console.log('Building exclude from fee transactions...');
			const excludeTxs = await this.buildExcludeFromFeeTransactions(config.tokenAddress, bundleWallets);
			result.transactions.push(...excludeTxs);

			// Step 8: Build approval transactions for bundle wallets (now wallets have ETH)
			console.log('Building approval transactions...');
			const approvalTxs = await this.buildApprovalTransactions(config.tokenAddress, bundleWallets);
			result.transactions.push(...approvalTxs);

			// Step 9: Build buy transactions for bundle wallets (now wallets have ETH)
			console.log('Building buy transactions...');
			const buyTxs = await this.buildBuyTransactionsWithEqualDistribution(config.tokenAddress, bundleWallets, walletAmounts);
			result.transactions.push(...buyTxs);

			// Step 10: Sign all transactions
			console.log('Signing transactions...');
			const signedTxs = await this.signAllTransactions(result.transactions);
			result.signedTransactions = signedTxs;

			// Step 11: Calculate total gas estimate
			result.totalGasEstimate = this.calculateTotalGasEstimate(result.transactions);

			// DEBUG: Log transaction summary
			console.log('\n=== TRANSACTION SUMMARY ===');
			console.log('[DEBUG] Total transactions:', result.transactions.length);
			console.log('[DEBUG] Transaction order:');
			result.transactions.forEach((tx, index) => {
				console.log(`[DEBUG] ${index + 1}. ${tx.type}: ${tx.description}`);
			});
			console.log('===========================\n');

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to orchestrate bundle launch'
			};
		}
	}

	/**
	 * Generate bundle wallets
	 */
	private async generateBundleWallets(count: number): Promise<BundleWallet[]> {
		const wallets: BundleWallet[] = [];
		for (let i = 0; i < count; i++) {
			const wallet = generateBundleWallet();
			wallets.push({
				...wallet,
				index: i
			});
		}
		return wallets;
	}

	/**
	 * Build clog transfer transaction
	 */
	private async buildClogTransfer(
		tokenAddress: string,
		amount: ethers.BigNumber,
		nonce: number
	): Promise<ServiceResponse<BundleLaunchTransaction>> {
		// DEBUG: Log signer information before building clog transfer
		console.log('\n=== CLOG TRANSFER DEBUG ===');
		console.log('[DEBUG] Building clog transfer transaction with:');
		console.log('[DEBUG] - Token address:', tokenAddress);
		console.log('[DEBUG] - Amount (wei):', amount.toString());
		// Get token decimals for proper formatting
		const tokenContract = new ethers.Contract(
			tokenAddress,
			['function decimals() view returns (uint8)'],
			this.provider
		);
		const tokenDecimals = await tokenContract.decimals();
		console.log('[DEBUG] - Amount (tokens):', ethers.utils.formatUnits(amount, tokenDecimals));
		console.log('[DEBUG] - Nonce:', nonce);
		console.log('[DEBUG] - Signer address:', this.devWallet.address);
		
		const signerBalance = await this.provider.getBalance(this.devWallet.address);
		const signerNonce = await this.provider.getTransactionCount(this.devWallet.address);
		console.log('[DEBUG] - Signer ETH balance:', ethers.utils.formatEther(signerBalance));
		console.log('[DEBUG] - Signer current nonce:', signerNonce);
		console.log('[DEBUG] - Expected nonce:', nonce);
		console.log('[DEBUG] - Nonce match:', signerNonce === nonce ? '✅ YES' : '❌ NO');
		
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('100000'); // Standard gas limit for ERC20 transfer
		console.log('[DEBUG] - Gas price:', gasPrice.toString());
		console.log('[DEBUG] - Gas limit:', gasLimit.toString());
		console.log('=============================\n');

		const result = await buildClogTransferTx({
			signer: this.devWallet,
			tokenAddress,
			to: tokenAddress, // Transfer to contract itself
			amount,
			nonce,
			gasLimit,
			gasPrice
		});

		if (!result.success || !result.data) {
			return { success: false, error: result.error || 'Failed to build clog transfer' };
		}

		return {
			success: true,
			data: {
				type: 'clog_transfer',
				description: `Transfer ${ethers.utils.formatEther(amount)} tokens to contract for clog`,
				transaction: result.data.tx
			}
		};
	}

	/**
	 * Build create pair transaction
	 */
	private async buildCreatePair(tokenAddress: string, nonce: number): Promise<ServiceResponse<BundleLaunchTransaction>> {
		// DEBUG: Log signer information before building createPair transaction
		console.log('\n=== CREATEPAIR TRANSACTION DEBUG ===');
		console.log('[DEBUG] Building createPair transaction with:');
		console.log('[DEBUG] - Token address:', tokenAddress);
		console.log('[DEBUG] - Nonce:', nonce);
		console.log('[DEBUG] - Signer address:', this.devWallet.address);
		
		const signerBalance = await this.provider.getBalance(this.devWallet.address);
		const signerNonce = await this.provider.getTransactionCount(this.devWallet.address);
		console.log('[DEBUG] - Signer ETH balance:', ethers.utils.formatEther(signerBalance));
		console.log('[DEBUG] - Signer current nonce:', signerNonce);
		console.log('[DEBUG] - Expected nonce:', nonce);
		console.log('[DEBUG] - Nonce match:', signerNonce === nonce ? '✅ YES' : '❌ NO');
		
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('5000000'); // 2.5M gas for create pair (Uniswap V2 is expensive)
		console.log('[DEBUG] - Gas price:', gasPrice.toString());
		console.log('[DEBUG] - Gas limit:', gasLimit.toString());
		console.log('=====================================\n');

		const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
		
		// TEMPORARY DEBUG CHECK: Verify Uniswap V2 Factory is accessible
		try {
			const factory = new ethers.Contract(
				'0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f',
				['function getPair(address, address) view returns (address)', 'function allPairs(uint) view returns (address)'],
				this.provider
			);
			const pairCount = await factory.allPairs(0); // This will fail if factory is not accessible
			console.log('[DEBUG] Uniswap V2 Factory is accessible');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.log('[DEBUG] Uniswap V2 Factory verification failed:', errorMessage);
			return { success: false, error: 'Uniswap V2 Factory verification failed: ' + errorMessage };
		}
		
		// TEMPORARY DEBUG CHECK: See if the pair already exists before trying to create it
		const factory = new ethers.Contract(
			'0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f',
			['function getPair(address, address) view returns (address)'],
			this.provider
		);
		const pairAddress = await factory.getPair(tokenAddress, WETH_ADDRESS);
		console.log('[DEBUG] Checking if Uniswap pair exists for', tokenAddress, 'and WETH:', WETH_ADDRESS, '->', pairAddress);
		if (pairAddress !== ethers.constants.AddressZero) {
			console.log('[DEBUG] Pair already exists, skipping createPair');
			return { success: false, error: 'Pair already exists! (TEMPORARY DEBUG CHECK)' };
		}

		// TEMPORARY DEBUG CHECK: Verify token contract exists and is valid
		try {
			const tokenContract = new ethers.Contract(
				tokenAddress,
				['function name() view returns (string)', 'function symbol() view returns (string)'],
				this.provider
			);
			const tokenName = await tokenContract.name();
			const tokenSymbol = await tokenContract.symbol();
			console.log('[DEBUG] Token contract verified:', tokenName, '(', tokenSymbol, ')');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.log('[DEBUG] Token contract verification failed:', errorMessage);
			return { success: false, error: 'Token contract verification failed: ' + errorMessage };
		}

		console.log('[DEBUG] Creating pair for token:', tokenAddress, 'and WETH:', WETH_ADDRESS);

		const result = await buildUniswapCreatePairTx({
			signer: this.devWallet,
			tokenA: tokenAddress,
			tokenB: WETH_ADDRESS,
			nonce,
			gasLimit,
			gasPrice,
			network: config.NETWORK
		});

		if (!result.success || !result.data) {
			console.log('[DEBUG] Failed to build createPair transaction:', result.error);
			return { success: false, error: result.error || 'Failed to build create pair' };
		}

		// TEMPORARY DEBUG CHECK: Log transaction details
		console.log('[DEBUG] CreatePair transaction built successfully');
		console.log('[DEBUG] Transaction data:', result.data.tx.data);
		console.log('[DEBUG] Gas limit:', result.data.tx.gasLimit?.toString());
		console.log('[DEBUG] Gas price:', result.data.tx.gasPrice?.toString());
		console.log('[DEBUG] Nonce:', result.data.tx.nonce);

		return {
			success: true,
			data: {
				type: 'create_pair',
				description: 'Create Uniswap V2 pair for token/WETH',
				transaction: result.data.tx
			}
		};
	}

	/**
	 * Build dev wallet approval for Uniswap Router
	 */
	private async buildDevWalletApproval(
		tokenAddress: string,
		nonce: number
	): Promise<ServiceResponse<BundleLaunchTransaction>> {
		// DEBUG: Log signer information before building dev wallet approval
		console.log('\n=== DEV WALLET APPROVAL DEBUG ===');
		console.log('[DEBUG] Building dev wallet approval transaction with:');
		console.log('[DEBUG] - Token address:', tokenAddress);
		console.log('[DEBUG] - Nonce:', nonce);
		console.log('[DEBUG] - Signer address:', this.devWallet.address);
		
		const signerBalance = await this.provider.getBalance(this.devWallet.address);
		const signerNonce = await this.provider.getTransactionCount(this.devWallet.address);
		console.log('[DEBUG] - Signer ETH balance:', ethers.utils.formatEther(signerBalance));
		console.log('[DEBUG] - Signer current nonce:', signerNonce);
		console.log('[DEBUG] - Expected nonce:', nonce);
		console.log('[DEBUG] - Nonce match:', signerNonce === nonce ? '✅ YES' : '❌ NO');
		
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('100000'); // 100K gas for approve
		console.log('[DEBUG] - Gas price:', gasPrice.toString());
		console.log('[DEBUG] - Gas limit:', gasLimit.toString());
		console.log('===================================\n');

		const maxApproval = ethers.constants.MaxUint256;
		const result = await buildApproveRouterTx({
			signer: this.devWallet,
			tokenAddress,
			amount: maxApproval,
			nonce,
			gasLimit,
			gasPrice,
			network: config.NETWORK
		});

		if (!result.success || !result.data) {
			return { success: false, error: result.error || 'Failed to build dev wallet approval' };
		}

		return {
			success: true,
			data: {
				type: 'dev_wallet_approval',
				description: 'Approve Uniswap Router for dev wallet (needed for add liquidity)',
				transaction: result.data.tx
			}
		};
	}

	/**
	 * Build add liquidity transaction
	 */
	private async buildAddLiquidity(
		tokenAddress: string,
		tokenAmount: ethers.BigNumber,
		ethAmount: string,
		nonce: number
	): Promise<ServiceResponse<BundleLaunchTransaction>> {
		// DEBUG: Log signer information before building add liquidity
		console.log('\n=== ADD LIQUIDITY DEBUG ===');
		console.log('[DEBUG] Building add liquidity transaction with:');
		console.log('[DEBUG] - Token address:', tokenAddress);
		console.log('[DEBUG] - Token amount (wei):', tokenAmount.toString());
		// Get token decimals for proper formatting
		const tokenContract = new ethers.Contract(
			tokenAddress,
			['function decimals() view returns (uint8)'],
			this.provider
		);
		const tokenDecimals = await tokenContract.decimals();
		console.log('[DEBUG] - Token amount (tokens):', ethers.utils.formatUnits(tokenAmount, tokenDecimals));
		console.log('[DEBUG] - ETH amount (wei):', ethAmount);
		console.log('[DEBUG] - ETH amount (ETH):', ethers.utils.formatEther(ethAmount));
		console.log('[DEBUG] - Nonce:', nonce);
		console.log('[DEBUG] - Signer address:', this.devWallet.address);
		
		const signerBalance = await this.provider.getBalance(this.devWallet.address);
		const signerNonce = await this.provider.getTransactionCount(this.devWallet.address);
		console.log('[DEBUG] - Signer ETH balance:', ethers.utils.formatEther(signerBalance));
		console.log('[DEBUG] - Signer current nonce:', signerNonce);
		console.log('[DEBUG] - Expected nonce:', nonce);
		console.log('[DEBUG] - Nonce match:', signerNonce === nonce ? '✅ YES' : '❌ NO');
		
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('700000'); // 700K gas for add liquidity
		const deadline = calculateDeadline(60); // 1 hour from now
		console.log('[DEBUG] - Gas price:', gasPrice.toString());
		console.log('[DEBUG] - Gas limit:', gasLimit.toString());
		console.log('[DEBUG] - Deadline:', deadline);
		console.log('==============================\n');

		const result = await buildAddLiquidityETH({
			signer: this.devWallet,
			tokenAddress,
			tokenAmount,
			ethAmount,
			to: this.devWallet.address,
			deadline,
			nonce,
			gasLimit,
			gasPrice,
			network: config.NETWORK
		});

		if (!result.success || !result.data) {
			return { success: false, error: result.error || 'Failed to build add liquidity' };
		}

		return {
			success: true,
			data: {
				type: 'add_liquidity',
				description: `Add liquidity: ${ethers.utils.formatEther(tokenAmount)} tokens + ${ethers.utils.formatEther(ethAmount)} ETH`,
				transaction: result.data.tx
			}
		};
	}

	/**
	 * Build fund wallet transactions
	 */
	private async buildFundWalletTransactionsWithEqualDistribution(
		wallets: BundleWallet[],
		walletAmounts: Array<{ walletIndex: number; ethAmount: bigint; expectedTokens: bigint }>,
		startingNonce: number
	): Promise<BundleLaunchTransaction[]> {
		const transactions: BundleLaunchTransaction[] = [];
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('21000'); // Standard gas limit for ETH transfer

		// DEBUG: Log funding wallet information
		console.log('\n=== FUND WALLET TRANSACTIONS DEBUG ===');
		console.log('[DEBUG] Funding wallet address:', this.fundingWallet.address);
		console.log('[DEBUG] Starting nonce:', startingNonce);
		console.log('[DEBUG] Number of wallets to fund:', wallets.length);
		console.log('========================================\n');

		for (let i = 0; i < wallets.length; i++) {
			const wallet = wallets[i];
			const walletAmount = walletAmounts[i];
			
			// DEBUG: Log each wallet funding amount
			console.log(`[DEBUG] Funding wallet ${i + 1}: ${ethers.utils.formatEther(walletAmount.ethAmount)} ETH (${walletAmount.ethAmount.toString()} wei)`);
			const result = await buildEthTransferTx({
				signer: this.fundingWallet,
				to: wallet.address,
				amount: ethers.BigNumber.from(walletAmount.ethAmount.toString()),
				nonce: startingNonce + i,
				gasLimit,
				gasPrice
			});

			if (result.success && result.data) {
				transactions.push({
					type: 'fund_wallet',
					description: `Fund wallet ${wallet.index + 1} with ${ethers.utils.formatEther(walletAmount.ethAmount)} ETH`,
					transaction: result.data.tx,
					walletIndex: wallet.index
				});
			}
		}

		return transactions;
	}

	/**
	 * Build exclude from fee transactions
	 */
	private async buildExcludeFromFeeTransactions(
		tokenAddress: string,
		wallets: BundleWallet[]
	): Promise<BundleLaunchTransaction[]> {
		const transactions: BundleLaunchTransaction[] = [];
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('100000'); // 100K gas for exclude from fee

		for (let i = 0; i < wallets.length; i++) {
			const wallet = wallets[i];
			// Get current nonce for each transaction
			const currentNonce = await getNextNonce(this.provider, this.devWallet.address);
			
			const result = await buildExcludeFromFeeTx({
				signer: this.devWallet,
				tokenAddress,
				walletAddress: wallet.address,
				nonce: currentNonce,
				gasLimit,
				gasPrice
			});

			if (result.success && result.data) {
				transactions.push({
					type: 'exclude_from_fee',
					description: `Exclude wallet ${wallet.index + 1} from fees`,
					transaction: result.data.tx,
					walletIndex: wallet.index
				});
			}
		}

		return transactions;
	}

	/**
	 * Build open trading V2 transaction (simplified version without automatic liquidity)
	 */
	private async buildOpenTrading(tokenAddress: string, nonce: number): Promise<ServiceResponse<BundleLaunchTransaction>> {
		// DEBUG: Log signer information before building open trading
		console.log('\n=== OPEN TRADING DEBUG ===');
		console.log('[DEBUG] Building open trading transaction with:');
		console.log('[DEBUG] - Token address:', tokenAddress);
		console.log('[DEBUG] - Nonce:', nonce);
		console.log('[DEBUG] - Signer address:', this.devWallet.address);
		
		const signerBalance = await this.provider.getBalance(this.devWallet.address);
		const signerNonce = await this.provider.getTransactionCount(this.devWallet.address);
		console.log('[DEBUG] - Signer ETH balance:', ethers.utils.formatEther(signerBalance));
		console.log('[DEBUG] - Signer current nonce:', signerNonce);
		console.log('[DEBUG] - Expected nonce:', nonce);
		console.log('[DEBUG] - Nonce match:', signerNonce === nonce ? '✅ YES' : '❌ NO');
		
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('1000000'); // 100K gas for open trading
		console.log('[DEBUG] - Gas price:', gasPrice.toString());
		console.log('[DEBUG] - Gas limit:', gasLimit.toString());
		console.log('============================\n');

		const result = await buildOpenTradingV2Tx({
			signer: this.devWallet,
			tokenAddress,
			nonce,
			gasLimit,
			gasPrice
		});

		if (!result.success || !result.data) {
			return { success: false, error: result.error || 'Failed to build open trading V2' };
		}

		return {
			success: true,
			data: {
				type: 'open_trading_v2',
				description: 'Open trading V2 on token contract (without automatic liquidity)',
				transaction: result.data.tx
			}
		};
	}

	/**
	 * Build approval transactions for bundle wallets
	 */
	private async buildApprovalTransactions(
		tokenAddress: string,
		wallets: BundleWallet[]
	): Promise<BundleLaunchTransaction[]> {
		const transactions: BundleLaunchTransaction[] = [];
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('100000'); // 100K gas for approve

		for (const wallet of wallets) {
			const walletSigner = new ethers.Wallet(wallet.privateKey, this.provider);
			const nonce = await getNextNonce(this.provider, wallet.address);
			const maxApproval = ethers.constants.MaxUint256;

			const result = await buildApproveRouterTx({
				signer: walletSigner,
				tokenAddress,
				amount: maxApproval,
				nonce,
				gasLimit,
				gasPrice,
				network: config.NETWORK
			});

			if (result.success && result.data) {
				transactions.push({
					type: 'approve_router',
					description: `Approve Uniswap Router for wallet ${wallet.index + 1}`,
					transaction: result.data.tx,
					walletIndex: wallet.index
				});
			}
		}

		return transactions;
	}

	/**
	 * Build buy transactions for bundle wallets
	 */
	private async buildBuyTransactionsWithEqualDistribution(
		tokenAddress: string,
		wallets: BundleWallet[],
		walletAmounts: Array<{ walletIndex: number; ethAmount: bigint; expectedTokens: bigint }>
	): Promise<BundleLaunchTransaction[]> {
		const transactions: BundleLaunchTransaction[] = [];
		const deadline = calculateDeadline(60); // 1 hour from now
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('700000'); // 700K gas for complex swaps

		for (let i = 0; i < wallets.length; i++) {
			const wallet = wallets[i];
			const walletAmount = walletAmounts[i];
			const walletSigner = new ethers.Wallet(wallet.privateKey, this.provider);
			const nonce = await getNextNonce(this.provider, wallet.address);
			const minTokensOut = ethers.constants.Zero; // No slippage protection for now

			const result = await buildBuyTokensWithEth({
				signer: walletSigner,
				tokenAddress,
				ethAmount: ethers.BigNumber.from(walletAmount.ethAmount.toString()),
				minTokensOut,
				deadline,
				nonce,
				gasLimit,
				gasPrice,
				network: config.NETWORK
			});

			if (result.success && result.data) {
				transactions.push({
					type: 'buy_tokens',
					description: `Buy tokens with ${ethers.utils.formatEther(walletAmount.ethAmount)} ETH for wallet ${wallet.index + 1}`,
					transaction: result.data.tx
				});
			}
		}

		return transactions;
	}

	/**
	 * Sign all transactions
	 */
	private async signAllTransactions(transactions: BundleLaunchTransaction[]): Promise<string[]> {
		const signedTransactions: string[] = [];

		for (const tx of transactions) {
			if (tx.type === 'fund_wallet') {
				// Fund wallet transactions are signed by funding wallet
				const signed = await signTransaction(tx.transaction, this.fundingWallet.privateKey);
				signedTransactions.push(signed);
			} else if (tx.type === 'approve_router' || tx.type === 'buy_tokens') {
				// These are signed by bundle wallets
				const wallet = this.findWalletByIndex(tx.walletIndex!);
				if (wallet) {
					const signed = await signTransaction(tx.transaction, wallet.privateKey);
					signedTransactions.push(signed);
				}
			} else {
				// All other transactions are signed by dev wallet
				const signed = await signTransaction(tx.transaction, this.devWallet.privateKey);
				signedTransactions.push(signed);
			}
		}

		return signedTransactions;
	}

	/**
	 * Find wallet by index
	 */
	private findWalletByIndex(index: number): BundleWallet | undefined {
		return this.bundleWallets.find(wallet => wallet.index === index);
	}

	/**
	 * Calculate total gas estimate
	 */
	private calculateTotalGasEstimate(transactions: BundleLaunchTransaction[]): string {
		const totalGas = transactions.reduce((sum, tx) => {
			const gasLimit = tx.transaction.gasLimit;
			return sum.add(gasLimit || ethers.BigNumber.from(21000));
		}, ethers.BigNumber.from(0));

		return totalGas.toString();
	}
} 