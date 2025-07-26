import { ethers } from 'ethers';
import type { ServiceResponse } from '../../types';

export interface TokenPrice {
  tokenAddress: string;
  price: string;
  priceUSD: string;
  volume24h: string;
  marketCap: string;
  priceChange24h: number;
  priceChange7d: number;
  lastUpdated: string;
  source: 'uniswap' | 'coingecko' | 'dexscreener' | 'manual';
}

export interface TokenPriceConfig {
  provider: ethers.providers.Provider;
  network: 'mainnet' | 'testnet';
  uniswapRouterAddress: string;
  wethAddress: string;
  cacheTimeout?: number; // in seconds
}

export interface PriceQuote {
  tokenAddress: string;
  price: string;
  priceUSD: string;
  volume24h: string;
  priceChange24h: number;
  source: string;
  timestamp: number;
}

export class TokenPriceService {
  private provider: ethers.providers.Provider;
  private network: 'mainnet' | 'testnet';
  private uniswapRouterAddress: string;
  private wethAddress: string;
  private cacheTimeout: number;
  private priceCache: Map<string, { price: TokenPrice; timestamp: number }> = new Map();

  constructor(config: TokenPriceConfig) {
    this.provider = config.provider;
    this.network = config.network;
    this.uniswapRouterAddress = config.uniswapRouterAddress;
    this.wethAddress = config.wethAddress;
    this.cacheTimeout = config.cacheTimeout || 300; // 5 minutes default
  }

  /**
   * Get current price for a token
   */
  async getTokenPrice(tokenAddress: string): Promise<ServiceResponse<TokenPrice>> {
    try {
      // Check cache first
      const cached = this.priceCache.get(tokenAddress);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout * 1000) {
        return {
          success: true,
          data: cached.price
        };
      }

      // Fetch from Uniswap
      const priceResult = await this.getUniswapPrice(tokenAddress);
      if (priceResult.success && priceResult.data) {
        const tokenPrice: TokenPrice = {
          tokenAddress,
          price: priceResult.data.price,
          priceUSD: priceResult.data.priceUSD,
          volume24h: '0', // Would need to fetch from analytics
          marketCap: '0', // Would need to fetch from analytics
          priceChange24h: 0, // Would need historical data
          priceChange7d: 0, // Would need historical data
          lastUpdated: new Date().toISOString(),
          source: 'uniswap'
        };

        // Cache the result
        this.priceCache.set(tokenAddress, {
          price: tokenPrice,
          timestamp: Date.now()
        });

        return {
          success: true,
          data: tokenPrice
        };
      }

      // Fallback to mock data for testing
      const mockPrice: TokenPrice = {
        tokenAddress,
        price: '0.0001',
        priceUSD: '0.0001',
        volume24h: '1000000',
        marketCap: '10000000',
        priceChange24h: 5.2,
        priceChange7d: -2.1,
        lastUpdated: new Date().toISOString(),
        source: 'manual'
      };

      return {
        success: true,
        data: mockPrice
      };

    } catch (error) {
      console.error('Error getting token price:', error);
      return {
        success: false,
        error: `Failed to get token price: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get prices for multiple tokens
   */
  async getTokenPrices(tokenAddresses: string[]): Promise<ServiceResponse<Record<string, TokenPrice>>> {
    try {
      const prices: Record<string, TokenPrice> = {};
      const promises = tokenAddresses.map(async (address) => {
        const result = await this.getTokenPrice(address);
        if (result.success && result.data) {
          prices[address] = result.data;
        }
      });

      await Promise.all(promises);

      return {
        success: true,
        data: prices
      };

    } catch (error) {
      console.error('Error getting token prices:', error);
      return {
        success: false,
        error: `Failed to get token prices: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get price quote for trading
   */
  async getPriceQuote(tokenAddress: string, amount: string): Promise<ServiceResponse<PriceQuote>> {
    try {
      const priceResult = await this.getTokenPrice(tokenAddress);
      if (!priceResult.success || !priceResult.data) {
        return {
          success: false,
          error: `Failed to get price for ${tokenAddress}`
        };
      }

      const quote: PriceQuote = {
        tokenAddress,
        price: priceResult.data.price,
        priceUSD: priceResult.data.priceUSD,
        volume24h: priceResult.data.volume24h,
        priceChange24h: priceResult.data.priceChange24h,
        source: priceResult.data.source,
        timestamp: Date.now()
      };

      return {
        success: true,
        data: quote
      };

    } catch (error) {
      console.error('Error getting price quote:', error);
      return {
        success: false,
        error: `Failed to get price quote: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get historical price data
   */
  async getHistoricalPrices(
    tokenAddress: string,
    days: number = 30
  ): Promise<ServiceResponse<Array<{ date: string; price: string; volume: string }>>> {
    try {
      // This would integrate with price APIs like CoinGecko or DEX aggregators
      // For now, returning mock historical data
      const historicalData = [];
      const basePrice = 0.0001;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simulate price volatility
        const volatility = 0.1; // 10% daily volatility
        const randomChange = (Math.random() - 0.5) * 2 * volatility;
        const price = basePrice * (1 + randomChange);
        
        historicalData.push({
          date: date.toISOString().split('T')[0],
          price: price.toString(),
          volume: (Math.random() * 1000000).toString()
        });
      }

      return {
        success: true,
        data: historicalData
      };

    } catch (error) {
      console.error('Error getting historical prices:', error);
      return {
        success: false,
        error: `Failed to get historical prices: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate price impact for a trade
   */
  async calculatePriceImpact(
    tokenAddress: string,
    amount: string,
    isBuy: boolean
  ): Promise<ServiceResponse<number>> {
    try {
      // This would calculate actual price impact based on pool reserves
      // For now, returning a simplified calculation
      const amountBN = ethers.utils.parseEther(amount);
      const impact = amountBN.mul(100).div(ethers.utils.parseEther('1000000')); // 0.01% per 1 ETH
      
      return {
        success: true,
        data: impact.toNumber() / 100
      };

    } catch (error) {
      console.error('Error calculating price impact:', error);
      return {
        success: false,
        error: `Failed to calculate price impact: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get Uniswap price for a token
   */
  private async getUniswapPrice(tokenAddress: string): Promise<ServiceResponse<{ price: string; priceUSD: string }>> {
    try {
      // This would use the Uniswap router to get the price
      // For now, returning mock data
      const mockPrice = {
        price: '0.0001',
        priceUSD: '0.0001'
      };

      return {
        success: true,
        data: mockPrice
      };

    } catch (error) {
      console.error('Error getting Uniswap price:', error);
      return {
        success: false,
        error: `Failed to get Uniswap price: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Clear price cache
   */
  clearCache(): void {
    this.priceCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: Array<{ tokenAddress: string; age: number }> } {
    const entries = Array.from(this.priceCache.entries()).map(([address, data]) => ({
      tokenAddress: address,
      age: Date.now() - data.timestamp
    }));

    return {
      size: this.priceCache.size,
      entries
    };
  }
} 