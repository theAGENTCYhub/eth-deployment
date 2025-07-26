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

			// Step 1: Generate bundle wallets
			console.log('Generating bundle wallets...');
			const bundleWallets = await this.generateBundleWallets(config.bundle_wallet_count);
			this.bundleWallets = bundleWallets;
			result.bundleWallets = bundleWallets;

			// Step 2: Calculate amounts
			const totalSupply = ethers.BigNumber.from(config.tokenTotalSupply);
			const tokensForClog = totalSupply.mul(100 - config.liquidity_token_percent).div(100);
			const tokensForLiquidity = totalSupply.sub(tokensForClog);
			
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
				tolerance: BigInt(1000)
			};

			const equalDistributionResult = await this.calculationService.calculateEqualTokenDistribution(equalDistributionConfig);
			if (!equalDistributionResult.success || !equalDistributionResult.data) {
				return { success: false, error: `Failed to calculate equal token distribution: ${equalDistributionResult.error}` };
			}

			const walletAmounts = equalDistributionResult.data.walletAmounts;
			console.log(`Equal token distribution calculated: ${walletAmounts.length} wallets`);

			// Get starting nonces for sequential management
			let devNonce = await getNextNonce(this.provider, this.devWallet.address);
			let fundingNonce = await getNextNonce(this.provider, this.fundingWallet.address);

			// Step 1: Build fund wallet transactions FIRST (so wallets have ETH for approve/buy)
			console.log('Building fund wallet transactions...');
			const fundTxs = await this.buildFundWalletTransactionsWithEqualDistribution(bundleWallets, walletAmounts, fundingNonce);
			result.transactions.push(...fundTxs);
			fundingNonce += fundTxs.length;

			// Step 2: Build clog transfer transaction
			console.log('Building clog transfer transaction...');
			const clogTx = await this.buildClogTransfer(config.tokenAddress, tokensForClog, devNonce++);
			if (!clogTx.success || !clogTx.data) {
				return { success: false, error: `Failed to build clog transfer: ${clogTx.error}` };
			}
			result.transactions.push(clogTx.data);

			// Step 3: Build create pair transaction
			console.log('Building create pair transaction...');
			const createPairTx = await this.buildCreatePair(config.tokenAddress, devNonce++);
			if (!createPairTx.success || !createPairTx.data) {
				return { success: false, error: `Failed to build create pair: ${createPairTx.error}` };
			}
			result.transactions.push(createPairTx.data);

			// Step 4: Build add liquidity transaction
			console.log('Building add liquidity transaction...');
			const addLiquidityTx = await this.buildAddLiquidity(
				config.tokenAddress,
				tokensForLiquidity,
				config.liquidity_eth_amount,
				devNonce++
			);
			if (!addLiquidityTx.success || !addLiquidityTx.data) {
				return { success: false, error: `Failed to build add liquidity: ${addLiquidityTx.error}` };
			}
			result.transactions.push(addLiquidityTx.data);

			// Step 5: Build open trading transaction
			console.log('Building open trading transaction...');
			const openTradingTx = await this.buildOpenTrading(config.tokenAddress, devNonce++);
			if (!openTradingTx.success || !openTradingTx.data) {
				return { success: false, error: `Failed to build open trading: ${openTradingTx.error}` };
			}
			result.transactions.push(openTradingTx.data);

			// Step 6: Build exclude from fee transactions
			console.log('Building exclude from fee transactions...');
			const excludeTxs = await this.buildExcludeFromFeeTransactions(config.tokenAddress, bundleWallets, devNonce);
			result.transactions.push(...excludeTxs);
			devNonce += excludeTxs.length;

			// Step 7: Build approval transactions for bundle wallets (now wallets have ETH)
			console.log('Building approval transactions...');
			const approvalTxs = await this.buildApprovalTransactions(config.tokenAddress, bundleWallets);
			result.transactions.push(...approvalTxs);

			// Step 8: Build buy transactions for bundle wallets (now wallets have ETH)
			console.log('Building buy transactions...');
			const buyTxs = await this.buildBuyTransactionsWithEqualDistribution(config.tokenAddress, bundleWallets, walletAmounts);
			result.transactions.push(...buyTxs);

			// Step 9: Sign all transactions
			console.log('Signing transactions...');
			const signedTxs = await this.signAllTransactions(result.transactions);
			result.signedTransactions = signedTxs;

			// Step 10: Calculate total gas estimate
			result.totalGasEstimate = this.calculateTotalGasEstimate(result.transactions);

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
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('100000'); // Standard gas limit for ERC20 transfer

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
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('200000'); // Standard gas limit for create pair

		const result = await buildUniswapCreatePairTx({
			signer: this.devWallet,
			tokenA: tokenAddress,
			tokenB: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
			nonce,
			gasLimit,
			gasPrice,
			network: config.NETWORK
		});

		if (!result.success || !result.data) {
			return { success: false, error: result.error || 'Failed to build create pair' };
		}

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
	 * Build add liquidity transaction
	 */
	private async buildAddLiquidity(
		tokenAddress: string,
		tokenAmount: ethers.BigNumber,
		ethAmount: string,
		nonce: number
	): Promise<ServiceResponse<BundleLaunchTransaction>> {
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('300000'); // Standard gas limit for add liquidity
		const deadline = calculateDeadline(60); // 1 hour from now

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

		for (let i = 0; i < wallets.length; i++) {
			const wallet = wallets[i];
			const walletAmount = walletAmounts[i];
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
		wallets: BundleWallet[],
		startingNonce: number
	): Promise<BundleLaunchTransaction[]> {
		const transactions: BundleLaunchTransaction[] = [];
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('50000'); // Standard gas limit for exclude from fee

		for (let i = 0; i < wallets.length; i++) {
			const wallet = wallets[i];
			const result = await buildExcludeFromFeeTx({
				signer: this.devWallet,
				tokenAddress,
				walletAddress: wallet.address,
				nonce: startingNonce + i,
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
		const gasPrice = await this.provider.getGasPrice();
		const gasLimit = ethers.BigNumber.from('50000'); // Standard gas limit for open trading

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
		const gasLimit = ethers.BigNumber.from('50000'); // Standard gas limit for approve

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
		const gasLimit = ethers.BigNumber.from('200000'); // Standard gas limit for swap

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
					transaction: result.data.tx,
					walletIndex: wallet.index
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