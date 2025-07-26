import { ethers } from 'ethers';
import type { ServiceResponse } from '../../types';
import type { Position, PnLCalculation } from './pnl-calculator.service';

export interface PortfolioMetrics {
  totalValue: string;
  totalInvested: string;
  totalPnL: string;
  totalPnLPercentage: number;
  totalPositions: number;
  activePositions: number;
  averageReturn: number;
  bestPerformer: {
    tokenAddress: string;
    pnlPercentage: number;
    pnl: string;
  };
  worstPerformer: {
    tokenAddress: string;
    pnlPercentage: number;
    pnl: string;
  };
  allocation: Record<string, {
    tokenAddress: string;
    value: string;
    percentage: number;
  }>;
}

export interface PortfolioAnalytics {
  metrics: PortfolioMetrics;
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
  };
  performanceMetrics: {
    totalReturn: number;
    annualizedReturn: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
  };
  timeSeriesData: Array<{
    date: string;
    totalValue: string;
    totalPnL: string;
  }>;
}

export interface PositionAllocation {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  value: string;
  percentage: number;
  quantity: string;
  averagePrice: string;
  currentPrice: string;
}

export class PortfolioCalculatorService {
  /**
   * Calculate comprehensive portfolio metrics
   */
  calculatePortfolioMetrics(positions: PnLCalculation[]): ServiceResponse<PortfolioMetrics> {
    try {
      if (positions.length === 0) {
        return {
          success: false,
          error: 'No positions provided for portfolio calculation'
        };
      }

      let totalValue = ethers.BigNumber.from(0);
      let totalInvested = ethers.BigNumber.from(0);
      let totalPnL = ethers.BigNumber.from(0);
      let activePositions = 0;
      let totalPnLPercentage = 0;

      const allocation: Record<string, { tokenAddress: string; value: string; percentage: number }> = {};
      let bestPerformer: { tokenAddress: string; pnlPercentage: number; pnl: string } | null = null;
      let worstPerformer: { tokenAddress: string; pnlPercentage: number; pnl: string } | null = null;

      // Calculate totals and find best/worst performers
      for (const position of positions) {
        const currentValue = ethers.utils.parseEther(position.currentValue);
        const entryValue = ethers.utils.parseEther(position.entryValue);
        const pnl = ethers.utils.parseEther(position.pnl);

        totalValue = totalValue.add(currentValue);
        totalInvested = totalInvested.add(entryValue);
        totalPnL = totalPnL.add(pnl);

        if (parseFloat(position.tokenBalance) > 0) {
          activePositions++;
        }

        // Track allocation
        if (!allocation[position.tokenAddress]) {
          allocation[position.tokenAddress] = {
            tokenAddress: position.tokenAddress,
            value: '0',
            percentage: 0
          };
        }

        const currentAllocation = ethers.utils.parseEther(allocation[position.tokenAddress].value);
        allocation[position.tokenAddress].value = ethers.utils.formatEther(currentAllocation.add(currentValue));

        // Track best/worst performers
        if (!bestPerformer || position.pnlPercentage > bestPerformer.pnlPercentage) {
          bestPerformer = {
            tokenAddress: position.tokenAddress,
            pnlPercentage: position.pnlPercentage,
            pnl: position.pnl
          };
        }

        if (!worstPerformer || position.pnlPercentage < worstPerformer.pnlPercentage) {
          worstPerformer = {
            tokenAddress: position.tokenAddress,
            pnlPercentage: position.pnlPercentage,
            pnl: position.pnl
          };
        }
      }

      // Calculate percentages
      totalPnLPercentage = totalInvested.gt(0) 
        ? totalPnL.mul(10000).div(totalInvested).toNumber() / 100 
        : 0;

      const averageReturn = positions.length > 0 
        ? positions.reduce((sum, pos) => sum + pos.pnlPercentage, 0) / positions.length 
        : 0;

      // Calculate allocation percentages
      for (const tokenAddress in allocation) {
        const value = ethers.utils.parseEther(allocation[tokenAddress].value);
        allocation[tokenAddress].percentage = totalValue.gt(0) 
          ? value.mul(10000).div(totalValue).toNumber() / 100 
          : 0;
      }

      const result: PortfolioMetrics = {
        totalValue: ethers.utils.formatEther(totalValue),
        totalInvested: ethers.utils.formatEther(totalInvested),
        totalPnL: ethers.utils.formatEther(totalPnL),
        totalPnLPercentage,
        totalPositions: positions.length,
        activePositions,
        averageReturn,
        bestPerformer: bestPerformer!,
        worstPerformer: worstPerformer!,
        allocation
      };

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error calculating portfolio metrics:', error);
      return {
        success: false,
        error: `Failed to calculate portfolio metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate position allocation breakdown
   */
  calculatePositionAllocation(
    positions: Position[],
    currentPrices: Record<string, string>,
    tokenInfo: Record<string, { name: string; symbol: string }>
  ): ServiceResponse<PositionAllocation[]> {
    try {
      const allocations: PositionAllocation[] = [];
      let totalValue = ethers.BigNumber.from(0);

      // Calculate current values and total
      for (const position of positions) {
        const currentPrice = currentPrices[position.tokenAddress];
        if (!currentPrice) {
          console.warn(`No current price found for token ${position.tokenAddress}`);
          continue;
        }

        const tokenBalance = ethers.utils.parseUnits(position.tokenBalance, 18);
        const price = ethers.utils.parseEther(currentPrice);
        const value = tokenBalance.mul(price).div(ethers.utils.parseEther('1'));

        totalValue = totalValue.add(value);

        const tokenName = tokenInfo[position.tokenAddress]?.name || 'Unknown';
        const tokenSymbol = tokenInfo[position.tokenAddress]?.symbol || 'UNKNOWN';

        allocations.push({
          tokenAddress: position.tokenAddress,
          tokenName,
          tokenSymbol,
          value: ethers.utils.formatEther(value),
          percentage: 0, // Will be calculated below
          quantity: position.tokenBalance,
          averagePrice: position.entryPrice,
          currentPrice
        });
      }

      // Calculate percentages
      for (const allocation of allocations) {
        const value = ethers.utils.parseEther(allocation.value);
        allocation.percentage = totalValue.gt(0) 
          ? value.mul(10000).div(totalValue).toNumber() / 100 
          : 0;
      }

      // Sort by value (descending)
      allocations.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));

      return {
        success: true,
        data: allocations
      };

    } catch (error) {
      console.error('Error calculating position allocation:', error);
      return {
        success: false,
        error: `Failed to calculate position allocation: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate portfolio risk metrics
   */
  calculateRiskMetrics(
    positions: PnLCalculation[],
    historicalData: Array<{ date: string; totalValue: string; totalPnL: string }>
  ): ServiceResponse<{
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
  }> {
    try {
      // Calculate volatility from historical data
      const returns = this.calculateReturns(historicalData);
      const volatility = this.calculateVolatility(returns);

      // Calculate Sharpe ratio (simplified - assuming risk-free rate of 0)
      const averageReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const sharpeRatio = volatility > 0 ? averageReturn / volatility : 0;

      // Calculate maximum drawdown
      const maxDrawdown = this.calculateMaxDrawdown(historicalData);

      // Calculate beta (simplified - would need market data)
      const beta = 1.0; // Default to market beta

      return {
        success: true,
        data: {
          volatility,
          sharpeRatio,
          maxDrawdown,
          beta
        }
      };

    } catch (error) {
      console.error('Error calculating risk metrics:', error);
      return {
        success: false,
        error: `Failed to calculate risk metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics(positions: PnLCalculation[]): ServiceResponse<{
    totalReturn: number;
    annualizedReturn: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
  }> {
    try {
      const profitablePositions = positions.filter(pos => pos.isProfit);
      const losingPositions = positions.filter(pos => !pos.isProfit);

      const winRate = positions.length > 0 ? (profitablePositions.length / positions.length) * 100 : 0;

      const averageWin = profitablePositions.length > 0
        ? profitablePositions.reduce((sum, pos) => sum + pos.pnlPercentage, 0) / profitablePositions.length
        : 0;

      const averageLoss = losingPositions.length > 0
        ? losingPositions.reduce((sum, pos) => sum + pos.pnlPercentage, 0) / losingPositions.length
        : 0;

      const totalReturn = positions.reduce((sum, pos) => sum + pos.pnlPercentage, 0);
      
      // Simplified annualized return (would need time period data)
      const annualizedReturn = totalReturn; // Assuming 1-year period

      return {
        success: true,
        data: {
          totalReturn,
          annualizedReturn,
          winRate,
          averageWin,
          averageLoss
        }
      };

    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return {
        success: false,
        error: `Failed to calculate performance metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Helper: Calculate returns from historical data
   */
  private calculateReturns(historicalData: Array<{ date: string; totalValue: string }>): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < historicalData.length; i++) {
      const prevValue = parseFloat(historicalData[i - 1].totalValue);
      const currentValue = parseFloat(historicalData[i].totalValue);
      
      if (prevValue > 0) {
        const return_ = (currentValue - prevValue) / prevValue;
        returns.push(return_);
      }
    }
    
    return returns;
  }

  /**
   * Helper: Calculate volatility from returns
   */
  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Helper: Calculate maximum drawdown
   */
  private calculateMaxDrawdown(historicalData: Array<{ date: string; totalValue: string }>): number {
    let maxDrawdown = 0;
    let peak = 0;
    
    for (const dataPoint of historicalData) {
      const value = parseFloat(dataPoint.totalValue);
      
      if (value > peak) {
        peak = value;
      }
      
      const drawdown = peak > 0 ? (peak - value) / peak : 0;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown * 100; // Return as percentage
  }
} 