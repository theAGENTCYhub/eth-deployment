import { ethers } from 'ethers';
import type { ServiceResponse } from '../../types';
import { buildAddLiquidityETH, buildUniswapRemoveLiquidityTx } from '../../transactions/uniswap-router.transaction';

export interface LiquidityConfig {
  provider: ethers.providers.Provider;
  network: 'mainnet' | 'testnet';
  uniswapRouterAddress: string;
  uniswapFactoryAddress: string;
  wethAddress: string;
}

export interface AddLiquidityRequest {
  walletPrivateKey: string;
  tokenAddress: string;
  tokenAmount: string;
  ethAmount: string;
  deadline?: number;
}

export interface RemoveLiquidityRequest {
  walletPrivateKey: string;
  tokenAddress: string;
  liquidityAmount: string;
  minTokenAmount: string;
  minEthAmount: string;
  deadline?: number;
}

export interface LiquidityResult {
  transactionHash: string;
  tokenAmount: string;
  ethAmount: string;
  liquidityReceived: string;
  gasUsed: string;
  gasPrice: string;
  totalCost: string;
}

export interface LiquidityPoolInfo {
  tokenAddress: string;
  pairAddress: string;
  tokenReserves: string;
  ethReserves: string;
  totalSupply: string;
  tokenPrice: string;
  liquidityUSD: string;
  volume24h: string;
}

export class LiquidityManagementService {
  private provider: ethers.providers.Provider;
  private network: 'mainnet' | 'testnet';
  private uniswapRouterAddress: string;
  private uniswapFactoryAddress: string;
  private wethAddress: string;

  constructor(config: LiquidityConfig) {
    this.provider = config.provider;
    this.network = config.network;
    this.uniswapRouterAddress = config.uniswapRouterAddress;
    this.uniswapFactoryAddress = config.uniswapFactoryAddress;
    this.wethAddress = config.wethAddress;
  }

  /**
   * Add liquidity to a token-ETH pair
   */
  async addLiquidity(request: AddLiquidityRequest): Promise<ServiceResponse<LiquidityResult>> {
    try {
      console.log(`Adding liquidity: ${request.tokenAmount} tokens + ${request.ethAmount} ETH...`);

      const signer = new ethers.Wallet(request.walletPrivateKey, this.provider);
      const deadline = request.deadline || Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      // Build the add liquidity transaction
      const buildResult = await buildAddLiquidityETH({
        signer,
        tokenAddress: request.tokenAddress,
        tokenAmount: ethers.utils.parseUnits(request.tokenAmount, 18),
        ethAmount: ethers.utils.parseEther(request.ethAmount),
        to: await signer.getAddress(),
        deadline,
        network: this.network
      });

      if (!buildResult.success || !buildResult.data) {
        return {
          success: false,
          error: `Failed to build add liquidity transaction: ${buildResult.error}`
        };
      }

      // Execute the transaction
      const startTime = Date.now();
      const tx = await signer.sendTransaction(buildResult.data.tx);
      const receipt = await tx.wait();

      // Parse the transaction logs to get actual amounts
      const actualAmounts = this.parseAddLiquidityLogs(receipt.logs, request.tokenAddress);

      const result: LiquidityResult = {
        transactionHash: tx.hash,
        tokenAmount: actualAmounts.tokenAmount,
        ethAmount: actualAmounts.ethAmount,
        liquidityReceived: actualAmounts.liquidity,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.effectiveGasPrice.toString(),
        totalCost: ethers.utils.formatEther(
          receipt.gasUsed.mul(receipt.effectiveGasPrice).add(ethers.utils.parseEther(request.ethAmount))
        )
      };

      console.log(`✅ Liquidity added: ${result.transactionHash}`);
      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error adding liquidity:', error);
      return {
        success: false,
        error: `Failed to add liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Remove liquidity from a token-ETH pair
   */
  async removeLiquidity(request: RemoveLiquidityRequest): Promise<ServiceResponse<LiquidityResult>> {
    try {
      console.log(`Removing liquidity: ${request.liquidityAmount} LP tokens...`);

      const signer = new ethers.Wallet(request.walletPrivateKey, this.provider);
      const deadline = request.deadline || Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      // Build the remove liquidity transaction
      const buildResult = await buildUniswapRemoveLiquidityTx({
        signer,
        tokenA: request.tokenAddress,
        tokenB: this.wethAddress,
        liquidity: ethers.utils.parseUnits(request.liquidityAmount, 18),
        amountAMin: ethers.utils.parseUnits(request.minTokenAmount, 18),
        amountBMin: ethers.utils.parseEther(request.minEthAmount),
        to: await signer.getAddress(),
        deadline,
        network: this.network
      });

      if (!buildResult.success || !buildResult.data) {
        return {
          success: false,
          error: `Failed to build remove liquidity transaction: ${buildResult.error}`
        };
      }

      // Execute the transaction
      const startTime = Date.now();
      const tx = await signer.sendTransaction(buildResult.data.tx);
      const receipt = await tx.wait();

      // Parse the transaction logs to get actual amounts
      const actualAmounts = this.parseRemoveLiquidityLogs(receipt.logs, request.tokenAddress);

      const result: LiquidityResult = {
        transactionHash: tx.hash,
        tokenAmount: actualAmounts.tokenAmount,
        ethAmount: actualAmounts.ethAmount,
        liquidityReceived: request.liquidityAmount, // Amount removed
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.effectiveGasPrice.toString(),
        totalCost: ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))
      };

      console.log(`✅ Liquidity removed: ${result.transactionHash}`);
      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error removing liquidity:', error);
      return {
        success: false,
        error: `Failed to remove liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get liquidity pool information
   */
  async getPoolInfo(tokenAddress: string): Promise<ServiceResponse<LiquidityPoolInfo>> {
    try {
      // This would fetch actual pool data from Uniswap
      // For now, returning mock data
      const mockPoolInfo: LiquidityPoolInfo = {
        tokenAddress,
        pairAddress: '0x1234567890123456789012345678901234567890',
        tokenReserves: '1000000000000000000000000', // 1M tokens
        ethReserves: '1000000000000000000', // 1 ETH
        totalSupply: '1000000000000000000', // 1 LP token
        tokenPrice: '0.000001',
        liquidityUSD: '2000000', // $2M liquidity
        volume24h: '500000' // $500K volume
      };

      return {
        success: true,
        data: mockPoolInfo
      };

    } catch (error) {
      console.error('Error getting pool info:', error);
      return {
        success: false,
        error: `Failed to get pool info: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate optimal liquidity amounts
   */
  async calculateOptimalLiquidity(
    tokenAddress: string,
    ethAmount: string
  ): Promise<ServiceResponse<{ tokenAmount: string; ethAmount: string; expectedLiquidity: string }>> {
    try {
      // This would calculate based on current pool reserves and price
      // For now, returning simplified calculation
      const ethAmountBN = ethers.utils.parseEther(ethAmount);
      const tokenAmount = ethAmountBN.mul(1000000); // 1:1M ratio for mock

      const result = {
        tokenAmount: ethers.utils.formatUnits(tokenAmount, 18),
        ethAmount,
        expectedLiquidity: ethers.utils.formatEther(ethAmountBN.mul(1000)) // Mock LP tokens
      };

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error calculating optimal liquidity:', error);
      return {
        success: false,
        error: `Failed to calculate optimal liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get liquidity position for a wallet
   */
  async getLiquidityPosition(
    walletAddress: string,
    tokenAddress: string
  ): Promise<ServiceResponse<{
    lpTokenBalance: string;
    tokenShare: string;
    ethShare: string;
    valueUSD: string;
  }>> {
    try {
      // This would fetch actual LP token balance and calculate shares
      // For now, returning mock data
      const mockPosition = {
        lpTokenBalance: '100000000000000000', // 0.1 LP tokens
        tokenShare: '100000000000000000000', // 100 tokens
        ethShare: '0.1', // 0.1 ETH
        valueUSD: '200' // $200 total value
      };

      return {
        success: true,
        data: mockPosition
      };

    } catch (error) {
      console.error('Error getting liquidity position:', error);
      return {
        success: false,
        error: `Failed to get liquidity position: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse add liquidity transaction logs
   */
  private parseAddLiquidityLogs(logs: ethers.providers.Log[], tokenAddress: string): {
    tokenAmount: string;
    ethAmount: string;
    liquidity: string;
  } {
    // This would parse actual Uniswap event logs
    // For now, returning mock data
    return {
      tokenAmount: '1000000000000000000000', // 1000 tokens
      ethAmount: '1.0', // 1 ETH
      liquidity: '1000000000000000000' // 1 LP token
    };
  }

  /**
   * Parse remove liquidity transaction logs
   */
  private parseRemoveLiquidityLogs(logs: ethers.providers.Log[], tokenAddress: string): {
    tokenAmount: string;
    ethAmount: string;
  } {
    // This would parse actual Uniswap event logs
    // For now, returning mock data
    return {
      tokenAmount: '100000000000000000000', // 100 tokens
      ethAmount: '0.1' // 0.1 ETH
    };
  }
} 