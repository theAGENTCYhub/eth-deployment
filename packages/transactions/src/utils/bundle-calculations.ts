import { ethers } from 'ethers';
import type { BundleLaunchConfig, BundleLaunchEstimate } from '../services/launch/launch.service';

// Uniswap V2 constants
const UNISWAP_V2_FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const UNISWAP_V2_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

// Gas constants
const GAS_LIMIT_PER_WALLET = 300000; // estimated gas per wallet operation
const GAS_PRICE_ESTIMATE = ethers.utils.parseUnits('20', 'gwei'); // 20 gwei estimate

/**
 * Calculate the total ETH required for a bundle launch
 */
export async function estimateBundleLaunch(
  provider: ethers.providers.Provider,
  config: BundleLaunchConfig
): Promise<BundleLaunchEstimate> {
  // Validate inputs
  if (config.bundle_wallet_count < 2 || config.bundle_wallet_count > 20) {
    throw new Error('Bundle wallet count must be between 2 and 20');
  }
  
  if (config.bundle_token_percent < 1 || config.bundle_token_percent > 50) {
    throw new Error('Bundle token percentage must be between 1% and 50%');
  }
  
  const liquidityEth = ethers.BigNumber.from(config.liquidity_eth_amount);
  if (liquidityEth.lt(ethers.utils.parseEther('0.1')) || liquidityEth.gt(ethers.utils.parseEther('100'))) {
    throw new Error('Liquidity ETH must be between 0.1 and 100 ETH');
  }
  
  // Parse amounts from wei
  const totalSupply = ethers.BigNumber.from(config.tokenTotalSupply);

	// Calculate token amounts
	const tokensForLiquidity = totalSupply.mul(config.liquidity_token_percent).div(100);
	const tokensForClog = totalSupply.sub(tokensForLiquidity); // Clog = total supply - liquidity tokens
	const totalTokensToBuy = totalSupply.mul(config.bundle_token_percent).div(100);
	const tokensPerWallet = totalTokensToBuy.div(config.bundle_wallet_count);

	// Calculate initial liquidity pool state
	const initialLiquidityPool = await calculateInitialLiquidityPool(
		provider,
		config.tokenAddress,
		liquidityEth,
		tokensForLiquidity
	);

	// Calculate bundle buy costs (simulating sequential buys)
	const bundleBuyResult = await calculateBundleBuyCosts(
		provider,
		config.tokenAddress,
		initialLiquidityPool,
		tokensPerWallet,
		config.bundle_wallet_count
	);

	// Calculate gas padding
	const gasPaddingEth = calculateGasPadding(config.bundle_wallet_count);

	// Calculate total ETH required
	const totalEthRequired = liquidityEth.add(bundleBuyResult.totalEth).add(gasPaddingEth);

	// Calculate overall price impact (from first to last wallet)
	const firstWalletImpact = bundleBuyResult.walletBreakdown[0]?.priceImpact || 0;
	const lastWalletImpact = bundleBuyResult.walletBreakdown[bundleBuyResult.walletBreakdown.length - 1]?.priceImpact || 0;
	const maxPriceImpact = Math.max(firstWalletImpact, lastWalletImpact);

	return {
		// Cost breakdown
		initialLiquidityEth: liquidityEth.toString(),
		bundleBuyEth: bundleBuyResult.totalEth.toString(),
		gasPaddingEth: gasPaddingEth.toString(),
		totalEthRequired: totalEthRequired.toString(),

		// Per-wallet breakdown
		ethPerWallet: bundleBuyResult.ethPerWallet.toString(),
		tokensPerWallet: tokensPerWallet.toString(),

		// Price impact estimates (precise)
		expectedPriceImpact: maxPriceImpact,
		slippageWarning: generateSlippageWarning(maxPriceImpact),

		// Bundle details
		totalTokensToBuy: totalTokensToBuy.toString(),
		tokensForLiquidity: tokensForLiquidity.toString(),
		tokensForClog: tokensForClog.toString(),

		// Detailed wallet breakdown
		walletBreakdown: bundleBuyResult.walletBreakdown.map(wallet => ({
			walletIndex: wallet.walletIndex,
			ethSpent: wallet.ethSpent.toString(),
			tokensReceived: wallet.tokensReceived.toString(),
			priceImpact: wallet.priceImpact
		}))
	};
}

/**
 * Calculate the initial liquidity pool state after adding initial liquidity
 */
async function calculateInitialLiquidityPool(
	provider: ethers.providers.Provider,
	tokenAddress: string,
	ethAmount: ethers.BigNumber,
	tokenAmount: ethers.BigNumber
): Promise<{
	ethReserve: ethers.BigNumber;
	tokenReserve: ethers.BigNumber;
	totalSupply: ethers.BigNumber;
}> {
	// For estimation purposes, we assume the pool is created with the specified amounts
	// In reality, this would be the result of calling addLiquidity on Uniswap
	return {
		ethReserve: ethAmount,
		tokenReserve: tokenAmount,
		totalSupply: ethAmount.mul(tokenAmount), // LP token supply (simplified for estimation)
	};
}

/**
 * Calculate the cost of buying tokens with multiple wallets (simulating price impact)
 * Uses precise Uniswap V2 pricing mechanics
 */
async function calculateBundleBuyCosts(
  provider: ethers.providers.Provider,
  tokenAddress: string,
  initialPool: { ethReserve: ethers.BigNumber; tokenReserve: ethers.BigNumber },
  tokensPerWallet: ethers.BigNumber,
  walletCount: number
): Promise<{
  totalEth: ethers.BigNumber;
  ethPerWallet: ethers.BigNumber;
  walletBreakdown: Array<{
    walletIndex: number;
    ethSpent: ethers.BigNumber;
    tokensReceived: ethers.BigNumber;
    priceImpact: number;
  }>;
}> {
  const FEE_NUMERATOR = 997; // 0.3% fee
  const FEE_DENOMINATOR = 1000;
  
  let currentEthReserve = initialPool.ethReserve;
  let currentTokenReserve = initialPool.tokenReserve;
  let totalEthSpent = ethers.BigNumber.from(0);
  const walletBreakdown: Array<{
    walletIndex: number;
    ethSpent: ethers.BigNumber;
    tokensReceived: ethers.BigNumber;
    priceImpact: number;
  }> = [];
  
  // Simulate each wallet buying tokens sequentially
  for (let i = 0; i < walletCount; i++) {
    // Calculate ETH needed for target tokens using binary search
    const ethForBuy = approximateEthForTokens(
      currentTokenReserve,
      currentEthReserve,
      tokensPerWallet,
      FEE_NUMERATOR,
      FEE_DENOMINATOR
    );
    
    // Calculate actual tokens received to verify using exact Uniswap V2 formula
    // For swapExactETHForTokensSupportingFeeOnTransferTokens
    const amountInWithFee = ethForBuy.mul(FEE_NUMERATOR); // amountIn * 997
    const numerator = amountInWithFee.mul(currentTokenReserve);
    const denominator = currentEthReserve.mul(FEE_DENOMINATOR).add(amountInWithFee); // reserveETH * 1000 + amountInWithFee
    const tokensReceived = numerator.div(denominator);
    
    // Calculate price impact for this wallet
    const initialPrice = initialPool.ethReserve.mul(ethers.utils.parseEther('1')).div(initialPool.tokenReserve);
    const currentPrice = currentEthReserve.mul(ethers.utils.parseEther('1')).div(currentTokenReserve);
    const priceImpact = currentPrice.sub(initialPrice).mul(100).div(initialPrice);
    
    walletBreakdown.push({
      walletIndex: i,
      ethSpent: ethForBuy,
      tokensReceived: tokensReceived,
      priceImpact: parseFloat(ethers.utils.formatEther(priceImpact))
    });
    
    totalEthSpent = totalEthSpent.add(ethForBuy);
    
    // Update pool reserves after this buy
    currentEthReserve = currentEthReserve.add(ethForBuy);
    currentTokenReserve = currentTokenReserve.sub(tokensReceived);
  }
  
  const ethPerWallet = totalEthSpent.div(walletCount);
  
  return {
    totalEth: totalEthSpent,
    ethPerWallet,
    walletBreakdown
  };
}

/**
 * Calculate ETH needed for target tokens using binary search
 * Uses precise Uniswap V2 swap formula for swapExactETHForTokensSupportingFeeOnTransferTokens
 * 
 * For ETH -> Token swaps with fee-on-transfer tokens:
 * amountOut = (amountInWithFee * reserveToken) / (reserveETH * 1000 + amountInWithFee)
 * where amountInWithFee = amountIn * 997
 */
function approximateEthForTokens(
  reserveToken: ethers.BigNumber,
  reserveETH: ethers.BigNumber,
  desiredTokensOut: ethers.BigNumber,
  feeNumerator: number,
  feeDenominator: number
): ethers.BigNumber {
  // Binary search to find ETH amount needed
  let low = ethers.BigNumber.from(0);
  let high = ethers.utils.parseEther('1000'); // 1000 ETH cap
  const epsilon = ethers.utils.parseEther('0.000001'); // 0.000001 ETH precision
  
  while (high.sub(low).gt(epsilon)) {
    const mid = low.add(high).div(2);
    
    // Calculate tokens out for this ETH amount using exact Uniswap V2 formula
    // For swapExactETHForTokensSupportingFeeOnTransferTokens
    const amountInWithFee = mid.mul(feeNumerator); // amountIn * 997
    const numerator = amountInWithFee.mul(reserveToken);
    const denominator = reserveETH.mul(feeDenominator).add(amountInWithFee); // reserveETH * 1000 + amountInWithFee
    const tokensOut = numerator.div(denominator);
    
    if (tokensOut.lt(desiredTokensOut)) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return high; // Return the higher value to ensure we get enough tokens
}

/**
 * Calculate tokens needed for target ETH using binary search
 * Uses precise Uniswap V2 swap formula for swapExactTokensForETHSupportingFeeOnTransferTokens
 * 
 * For Token -> ETH swaps with fee-on-transfer tokens:
 * amountOut = (amountInWithFee * reserveETH) / (reserveToken * 1000 + amountInWithFee)
 * where amountInWithFee = amountIn * 997
 */
function approximateTokensForEth(
  reserveToken: ethers.BigNumber,
  reserveETH: ethers.BigNumber,
  desiredEthOut: ethers.BigNumber,
  feeNumerator: number,
  feeDenominator: number
): ethers.BigNumber {
  // Binary search to find token amount needed
  let low = ethers.BigNumber.from(0);
  let high = reserveToken; // Can't spend more than total reserve
  const epsilon = ethers.BigNumber.from(1); // 1 wei precision
  
  while (high.sub(low).gt(epsilon)) {
    const mid = low.add(high).div(2);
    
    // Calculate ETH out for this token amount using exact Uniswap V2 formula
    // For swapExactTokensForETHSupportingFeeOnTransferTokens
    const amountInWithFee = mid.mul(feeNumerator); // amountIn * 997
    const numerator = amountInWithFee.mul(reserveETH);
    const denominator = reserveToken.mul(feeDenominator).add(amountInWithFee); // reserveToken * 1000 + amountInWithFee
    const ethOut = numerator.div(denominator);
    
    if (ethOut.lt(desiredEthOut)) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return high; // Return the higher value to ensure we get enough ETH
}

/**
 * Calculate gas padding for all bundle wallets
 */
function calculateGasPadding(walletCount: number): ethers.BigNumber {
	const totalGas = GAS_LIMIT_PER_WALLET * walletCount;
	return GAS_PRICE_ESTIMATE.mul(totalGas);
}

/**
 * Calculate expected price impact percentage
 */
function calculatePriceImpact(
  initialPool: { ethReserve: ethers.BigNumber; tokenReserve: ethers.BigNumber },
  totalEthSpent: ethers.BigNumber,
  totalTokensBought: ethers.BigNumber
): number {
  // Calculate final pool state
  const finalEthReserve = initialPool.ethReserve.add(totalEthSpent);
  const finalTokenReserve = initialPool.tokenReserve.sub(totalTokensBought);
  
  // Calculate price change (ETH per token)
  const initialPrice = initialPool.ethReserve.mul(ethers.utils.parseEther('1')).div(initialPool.tokenReserve);
  const finalPrice = finalEthReserve.mul(ethers.utils.parseEther('1')).div(finalTokenReserve);
  
  // Calculate percentage change
  if (initialPrice.isZero()) {
    return 0;
  }
  
  const priceChange = finalPrice.sub(initialPrice);
  const priceImpact = priceChange.mul(100).div(initialPrice);
  
  // Convert to number and ensure it's positive (price should increase when buying)
  const impactPercent = parseFloat(ethers.utils.formatEther(priceImpact));
  return Math.max(0, impactPercent); // Ensure non-negative
}

/**
 * Generate slippage warning based on price impact
 */
function generateSlippageWarning(priceImpact: number): string {
	if (priceImpact > 50) {
		return '⚠️ EXTREME SLIPPAGE: Price impact >50%. Consider reducing bundle size.';
	} else if (priceImpact > 20) {
		return '⚠️ HIGH SLIPPAGE: Price impact >20%. Bundle buys will significantly move price.';
	} else if (priceImpact > 10) {
		return '⚠️ MODERATE SLIPPAGE: Price impact >10%. Bundle will have noticeable price impact.';
	} else {
		return '✅ LOW SLIPPAGE: Price impact <10%. Bundle should execute smoothly.';
	}
} 