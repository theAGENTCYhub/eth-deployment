import { ethers } from 'ethers';
import type { ServiceResponse } from '../../types';

export interface Position {
  id: string;
  walletAddress: string;
  tokenAddress: string;
  tokenBalance: string;
  entryValue: string;
  entryPrice: string;
  currentPrice?: string;
  lastUpdated?: string;
}

export interface PnLCalculation {
  positionId: string;
  tokenAddress: string;
  tokenBalance: string;
  entryValue: string;
  currentValue: string;
  entryPrice: string;
  currentPrice: string;
  pnl: string;
  pnlPercentage: number;
  isProfit: boolean;
  priceChange: number;
}

export interface PortfolioCalculation {
  totalPositions: number;
  totalEntryValue: string;
  totalCurrentValue: string;
  totalPnL: string;
  totalPnLPercentage: number;
  isOverallProfit: boolean;
  positions: PnLCalculation[];
}

export class PnLCalculatorService {
  /**
   * Calculate P&L for a single position
   */
  calculatePositionPnL(position: Position, currentPrice: string): ServiceResponse<PnLCalculation> {
    try {
      const entryValue = ethers.utils.parseEther(position.entryValue);
      const currentPriceBN = ethers.utils.parseEther(currentPrice);
      const tokenBalance = ethers.utils.parseUnits(position.tokenBalance, 18);
      
      // Calculate current value
      const currentValue = tokenBalance.mul(currentPriceBN).div(ethers.utils.parseEther('1'));
      
      // Calculate P&L
      const pnl = currentValue.sub(entryValue);
      const pnlPercentage = entryValue.gt(0) 
        ? pnl.mul(10000).div(entryValue).toNumber() / 100 
        : 0;
      
      // Calculate price change
      const entryPrice = ethers.utils.parseEther(position.entryPrice);
      const priceChange = entryPrice.gt(0) 
        ? currentPriceBN.sub(entryPrice).mul(10000).div(entryPrice).toNumber() / 100 
        : 0;

      const result: PnLCalculation = {
        positionId: position.id,
        tokenAddress: position.tokenAddress,
        tokenBalance: position.tokenBalance,
        entryValue: position.entryValue,
        currentValue: ethers.utils.formatEther(currentValue),
        entryPrice: position.entryPrice,
        currentPrice,
        pnl: ethers.utils.formatEther(pnl),
        pnlPercentage,
        isProfit: pnl.gte(0),
        priceChange
      };

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error calculating position P&L:', error);
      return {
        success: false,
        error: `Failed to calculate P&L: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate P&L for multiple positions (portfolio)
   */
  calculatePortfolioPnL(positions: Position[], currentPrices: Record<string, string>): ServiceResponse<PortfolioCalculation> {
    try {
      const pnlCalculations: PnLCalculation[] = [];
      let totalEntryValue = ethers.BigNumber.from(0);
      let totalCurrentValue = ethers.BigNumber.from(0);

      // Calculate P&L for each position
      for (const position of positions) {
        const currentPrice = currentPrices[position.tokenAddress];
        if (!currentPrice) {
          console.warn(`No current price found for token ${position.tokenAddress}`);
          continue;
        }

        const pnlResult = this.calculatePositionPnL(position, currentPrice);
        if (pnlResult.success && pnlResult.data) {
          pnlCalculations.push(pnlResult.data);
          
          // Accumulate totals
          totalEntryValue = totalEntryValue.add(ethers.utils.parseEther(pnlResult.data.entryValue));
          totalCurrentValue = totalCurrentValue.add(ethers.utils.parseEther(pnlResult.data.currentValue));
        }
      }

      // Calculate portfolio totals
      const totalPnL = totalCurrentValue.sub(totalEntryValue);
      const totalPnLPercentage = totalEntryValue.gt(0) 
        ? totalPnL.mul(10000).div(totalEntryValue).toNumber() / 100 
        : 0;

      const result: PortfolioCalculation = {
        totalPositions: pnlCalculations.length,
        totalEntryValue: ethers.utils.formatEther(totalEntryValue),
        totalCurrentValue: ethers.utils.formatEther(totalCurrentValue),
        totalPnL: ethers.utils.formatEther(totalPnL),
        totalPnLPercentage,
        isOverallProfit: totalPnL.gte(0),
        positions: pnlCalculations
      };

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error calculating portfolio P&L:', error);
      return {
        success: false,
        error: `Failed to calculate portfolio P&L: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate percentage change between two values
   */
  calculatePercentageChange(oldValue: string, newValue: string): ServiceResponse<number> {
    try {
      const oldValueBN = ethers.utils.parseEther(oldValue);
      const newValueBN = ethers.utils.parseEther(newValue);
      
      if (oldValueBN.eq(0)) {
        return {
          success: false,
          error: 'Cannot calculate percentage change from zero'
        };
      }

      const change = newValueBN.sub(oldValueBN);
      const percentageChange = change.mul(10000).div(oldValueBN).toNumber() / 100;

      return {
        success: true,
        data: percentageChange
      };

    } catch (error) {
      console.error('Error calculating percentage change:', error);
      return {
        success: false,
        error: `Failed to calculate percentage change: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate average cost basis for positions with multiple entries
   */
  calculateAverageCostBasis(entries: Array<{ amount: string; price: string }>): ServiceResponse<{
    totalAmount: string;
    averagePrice: string;
    totalValue: string;
  }> {
    try {
      let totalAmount = ethers.BigNumber.from(0);
      let totalValue = ethers.BigNumber.from(0);

      for (const entry of entries) {
        const amount = ethers.utils.parseUnits(entry.amount, 18);
        const price = ethers.utils.parseEther(entry.price);
        const value = amount.mul(price).div(ethers.utils.parseEther('1'));

        totalAmount = totalAmount.add(amount);
        totalValue = totalValue.add(value);
      }

      const averagePrice = totalAmount.gt(0) 
        ? totalValue.mul(ethers.utils.parseEther('1')).div(totalAmount)
        : ethers.BigNumber.from(0);

      return {
        success: true,
        data: {
          totalAmount: ethers.utils.formatUnits(totalAmount, 18),
          averagePrice: ethers.utils.formatEther(averagePrice),
          totalValue: ethers.utils.formatEther(totalValue)
        }
      };

    } catch (error) {
      console.error('Error calculating average cost basis:', error);
      return {
        success: false,
        error: `Failed to calculate average cost basis: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate unrealized P&L (for positions that haven't been sold)
   */
  calculateUnrealizedPnL(
    position: Position,
    currentPrice: string,
    realizedPnL: string = '0'
  ): ServiceResponse<{
    unrealizedPnL: string;
    totalPnL: string;
    unrealizedPnLPercentage: number;
    totalPnLPercentage: number;
  }> {
    try {
      const unrealizedPnLResult = this.calculatePositionPnL(position, currentPrice);
      if (!unrealizedPnLResult.success || !unrealizedPnLResult.data) {
        return {
          success: false,
          error: unrealizedPnLResult.error
        };
      }

      const unrealizedPnL = ethers.utils.parseEther(unrealizedPnLResult.data.pnl);
      const realizedPnLBN = ethers.utils.parseEther(realizedPnL);
      const totalPnL = unrealizedPnL.add(realizedPnLBN);
      const entryValue = ethers.utils.parseEther(position.entryValue);

      const unrealizedPnLPercentage = entryValue.gt(0) 
        ? unrealizedPnL.mul(10000).div(entryValue).toNumber() / 100 
        : 0;

      const totalPnLPercentage = entryValue.gt(0) 
        ? totalPnL.mul(10000).div(entryValue).toNumber() / 100 
        : 0;

      return {
        success: true,
        data: {
          unrealizedPnL: ethers.utils.formatEther(unrealizedPnL),
          totalPnL: ethers.utils.formatEther(totalPnL),
          unrealizedPnLPercentage,
          totalPnLPercentage
        }
      };

    } catch (error) {
      console.error('Error calculating unrealized P&L:', error);
      return {
        success: false,
        error: `Failed to calculate unrealized P&L: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 