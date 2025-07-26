import { ethers } from 'ethers';
import type { ServiceResponse } from '../../types';
import { buyTokenWithEth, sellTokenForEth, getAmountsOut, getAmountsIn } from '../../transactions/uniswap-router.transaction';

export interface TradingConfig {
  provider: ethers.providers.Provider;
  network: 'mainnet' | 'testnet';
  userId: string;
}

export interface BuyTokensRequest {
  walletPrivateKey: string; // Direct private key for now
  tokenAddress: string;
  ethAmount: string;
  slippagePercent: number;
  deadline?: number;
}

export interface SellTokensRequest {
  walletPrivateKey: string; // Direct private key for now
  tokenAddress: string;
  tokenAmount: string;
  slippagePercent: number;
  deadline?: number;
}

export interface TradingResult {
  transactionHash: string;
  amountIn: string;
  amountOut: string;
  gasUsed: string;
  gasPrice: string;
  totalCost: string;
  slippageApplied: number;
  executionTime: number;
}

export interface TradingQuote {
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  gasEstimate: string;
  route: string[];
}

export class TradingService {
  private provider: ethers.providers.Provider;
  private network: 'mainnet' | 'testnet';
  private userId: string;

  constructor(config: TradingConfig) {
    this.provider = config.provider;
    this.network = config.network;
    this.userId = config.userId;
  }

  /**
   * Buy tokens with ETH
   */
  async buyTokensWithETH(request: BuyTokensRequest): Promise<ServiceResponse<TradingResult>> {
    try {
      console.log(`Buying tokens with ${request.ethAmount} ETH...`);

      // Step 1: Create signer from private key
      const signer = new ethers.Wallet(request.walletPrivateKey, this.provider);

      // Step 2: Get quote for the trade
      const quoteResult = await this.getBuyQuote({
        tokenAddress: request.tokenAddress,
        ethAmount: request.ethAmount
      });

      if (!quoteResult.success || !quoteResult.data) {
        return {
          success: false,
          error: `Failed to get quote: ${quoteResult.error}`
        };
      }

      // Step 3: Calculate slippage-adjusted amount out
      const slippageAdjustedAmountOut = this.calculateSlippageAdjustedAmount(
        ethers.utils.parseUnits(quoteResult.data.amountOut, 18),
        request.slippagePercent,
        'buy'
      );

      // Step 4: Build the swap transaction
      const deadline = request.deadline || Math.floor(Date.now() / 1000) + 1200; // 20 minutes
      
      const buildResult = await buyTokenWithEth({
        signer,
        path: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', request.tokenAddress], // WETH -> Token
        amountIn: ethers.utils.parseEther(request.ethAmount),
        amountOutMin: slippageAdjustedAmountOut,
        to: await signer.getAddress(),
        deadline,
        network: this.network
      });

      if (!buildResult.success || !buildResult.data) {
        return {
          success: false,
          error: `Failed to build swap transaction: ${buildResult.error}`
        };
      }

      // Step 5: Execute the transaction
      const startTime = Date.now();
      const tx = await signer.sendTransaction(buildResult.data.tx);
      const receipt = await tx.wait();
      const executionTime = Date.now() - startTime;

      // Step 6: Calculate actual slippage applied
      const actualSlippage = this.calculateActualSlippage(
        ethers.utils.parseUnits(quoteResult.data.amountOut, 18),
        ethers.utils.parseUnits(quoteResult.data.amountOut, 18) // Mock actual amount for now
      );

      const result: TradingResult = {
        transactionHash: tx.hash,
        amountIn: request.ethAmount,
        amountOut: quoteResult.data.amountOut,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.effectiveGasPrice.toString(),
        totalCost: ethers.utils.formatEther(
          receipt.gasUsed.mul(receipt.effectiveGasPrice).add(ethers.utils.parseEther(request.ethAmount))
        ),
        slippageApplied: actualSlippage,
        executionTime
      };

      console.log(`✅ Buy trade completed: ${result.transactionHash}`);
      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error buying tokens:', error);
      return {
        success: false,
        error: `Buy trade failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Sell tokens for ETH
   */
  async sellTokensForETH(request: SellTokensRequest): Promise<ServiceResponse<TradingResult>> {
    try {
      console.log(`Selling ${request.tokenAmount} tokens for ETH...`);

      // Step 1: Create signer from private key
      const signer = new ethers.Wallet(request.walletPrivateKey, this.provider);

      // Step 2: Get quote for the trade
      const quoteResult = await this.getSellQuote({
        tokenAddress: request.tokenAddress,
        tokenAmount: request.tokenAmount
      });

      if (!quoteResult.success || !quoteResult.data) {
        return {
          success: false,
          error: `Failed to get quote: ${quoteResult.error}`
        };
      }

      // Step 3: Calculate slippage-adjusted amount out
      const slippageAdjustedAmountOut = this.calculateSlippageAdjustedAmount(
        ethers.utils.parseEther(quoteResult.data.amountOut),
        request.slippagePercent,
        'sell'
      );

      // Step 4: Build the swap transaction
      const deadline = request.deadline || Math.floor(Date.now() / 1000) + 1200; // 20 minutes
      
      const buildResult = await sellTokenForEth({
        signer,
        path: [request.tokenAddress, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'], // Token -> WETH
        amountIn: ethers.utils.parseUnits(request.tokenAmount, 18),
        amountOutMin: slippageAdjustedAmountOut,
        to: await signer.getAddress(),
        deadline,
        network: this.network
      });

      if (!buildResult.success || !buildResult.data) {
        return {
          success: false,
          error: `Failed to build swap transaction: ${buildResult.error}`
        };
      }

      // Step 5: Execute the transaction
      const startTime = Date.now();
      const tx = await signer.sendTransaction(buildResult.data.tx);
      const receipt = await tx.wait();
      const executionTime = Date.now() - startTime;

      // Step 6: Calculate actual slippage applied
      const actualSlippage = this.calculateActualSlippage(
        ethers.utils.parseEther(quoteResult.data.amountOut),
        ethers.utils.parseEther(quoteResult.data.amountOut) // Mock actual amount for now
      );

      const result: TradingResult = {
        transactionHash: tx.hash,
        amountIn: request.tokenAmount,
        amountOut: quoteResult.data.amountOut,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.effectiveGasPrice.toString(),
        totalCost: ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice)),
        slippageApplied: actualSlippage,
        executionTime
      };

      console.log(`✅ Sell trade completed: ${result.transactionHash}`);
      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error selling tokens:', error);
      return {
        success: false,
        error: `Sell trade failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get quote for buying tokens with ETH
   */
  async getBuyQuote(params: { tokenAddress: string; ethAmount: string }): Promise<ServiceResponse<TradingQuote>> {
    try {
      const quoteResult = await getAmountsOut({
        provider: this.provider,
        amountIn: ethers.utils.parseEther(params.ethAmount),
        path: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', params.tokenAddress], // WETH -> Token
        network: this.network
      });

      if (!quoteResult.success || !quoteResult.data) {
        return {
          success: false,
          error: quoteResult.error
        };
      }

      const amountOut = quoteResult.data.amounts[1];
      const priceImpact = this.calculatePriceImpact(
        ethers.utils.parseEther(params.ethAmount),
        amountOut
      );

      const result: TradingQuote = {
        amountIn: params.ethAmount,
        amountOut: ethers.utils.formatUnits(amountOut, 18),
        priceImpact,
        gasEstimate: '300000', // Default estimate
        route: ['WETH', params.tokenAddress]
      };

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error getting buy quote:', error);
      return {
        success: false,
        error: `Failed to get buy quote: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get quote for selling tokens for ETH
   */
  async getSellQuote(params: { tokenAddress: string; tokenAmount: string }): Promise<ServiceResponse<TradingQuote>> {
    try {
      const quoteResult = await getAmountsOut({
        provider: this.provider,
        amountIn: ethers.utils.parseUnits(params.tokenAmount, 18),
        path: [params.tokenAddress, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'], // Token -> WETH
        network: this.network
      });

      if (!quoteResult.success || !quoteResult.data) {
        return {
          success: false,
          error: quoteResult.error
        };
      }

      const amountOut = quoteResult.data.amounts[1];
      const priceImpact = this.calculatePriceImpact(
        ethers.utils.parseUnits(params.tokenAmount, 18),
        amountOut
      );

      const result: TradingQuote = {
        amountIn: params.tokenAmount,
        amountOut: ethers.utils.formatEther(amountOut),
        priceImpact,
        gasEstimate: '300000', // Default estimate
        route: [params.tokenAddress, 'WETH']
      };

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error getting sell quote:', error);
      return {
        success: false,
        error: `Failed to get sell quote: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate slippage-adjusted amount
   */
  private calculateSlippageAdjustedAmount(
    expectedAmount: ethers.BigNumber,
    slippagePercent: number,
    direction: 'buy' | 'sell'
  ): ethers.BigNumber {
    const slippageMultiplier = (100 - slippagePercent) / 100;
    return expectedAmount.mul(Math.floor(slippageMultiplier * 1000)).div(1000);
  }

  /**
   * Calculate actual slippage applied
   */
  private calculateActualSlippage(expectedAmount: ethers.BigNumber, actualAmount: ethers.BigNumber): number {
    const difference = expectedAmount.sub(actualAmount);
    return (difference.mul(10000).div(expectedAmount).toNumber() / 100);
  }

  /**
   * Calculate price impact
   */
  private calculatePriceImpact(amountIn: ethers.BigNumber, amountOut: ethers.BigNumber): number {
    // This is a simplified calculation - in reality, you'd need pool reserves
    return 0.1; // Mock 0.1% price impact
  }
} 