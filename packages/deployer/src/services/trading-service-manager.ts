import { ethers } from 'ethers';
import { 
  TradingService, 
  TradingConfig, 
  BuyTokensRequest, 
  SellTokensRequest,
  PnLCalculatorService,
  PortfolioCalculatorService,
  TokenPriceService,
  TokenPriceConfig,
  LiquidityManagementService,
  LiquidityConfig
} from '@eth-deployer/transactions';
import { config } from '../config/env';

export interface ServiceManagerConfig {
  provider: ethers.providers.Provider;
  network: 'mainnet' | 'testnet';
  userId: string;
}

export interface LaunchData {
  id: string;
  tokenName: string;
  tokenAddress: string;
  totalSupply: string;
  bundleWallets: number;
  liquidityPool: string;
  poolValue: string;
  positions: number;
  totalPnL: string;
  pnlPercentage: string;
  totalInvested?: string;
  currentValue?: string;
}

export interface PositionData {
  walletId: string;
  walletAddress: string;
  tokenBalance: string;
  entryValue: string;
  currentValue: string;
  pnl: number;
  pnlPercentage: string;
}

export interface PositionDetailData {
  walletId: string;
  walletAddress: string;
  tokenBalance: string;
  entryValue: string;
  currentValue: string;
  pnl: number;
  pnlPercentage: string;
  slippage: number;
}

export interface TradeData {
  launchId: string;
  walletId: string;
  mode: 'buy' | 'sell';
  amount: string;
  estimatedTokens: string;
  slippage: number;
  gasEstimate: string;
  totalCost: string;
}

export class TradingServiceManager {
  private provider: ethers.providers.Provider;
  private network: 'mainnet' | 'testnet';
  private userId: string;
  private tradingService: TradingService;
  private pnlCalculator: PnLCalculatorService;
  private portfolioCalculator: PortfolioCalculatorService;
  private priceService: TokenPriceService;
  private liquidityService: LiquidityManagementService;

  constructor(config: ServiceManagerConfig) {
    this.provider = config.provider;
    this.network = config.network;
    this.userId = config.userId;

    // Initialize trading service
    const tradingConfig: TradingConfig = {
      provider: this.provider,
      network: this.network,
      userId: this.userId
    };
    this.tradingService = new TradingService(tradingConfig);

    // Initialize calculation services
    this.pnlCalculator = new PnLCalculatorService();
    this.portfolioCalculator = new PortfolioCalculatorService();

    // Initialize price service
    const priceConfig: TokenPriceConfig = {
      provider: this.provider,
      network: this.network,
      uniswapRouterAddress: this.getUniswapRouterAddress(),
      wethAddress: this.getWethAddress(),
      cacheTimeout: 300 // 5 minutes
    };
    this.priceService = new TokenPriceService(priceConfig);

    // Initialize liquidity service
    const liquidityConfig: LiquidityConfig = {
      provider: this.provider,
      network: this.network,
      uniswapRouterAddress: this.getUniswapRouterAddress(),
      uniswapFactoryAddress: this.getUniswapFactoryAddress(),
      wethAddress: this.getWethAddress()
    };
    this.liquidityService = new LiquidityManagementService(liquidityConfig);
  }

  /**
   * Get launches data with real calculations
   */
  async getLaunchesData(): Promise<LaunchData[]> {
    try {
      // For now, return mock data but with real price calculations
      // In the future, this would fetch from database
      const mockLaunches: LaunchData[] = [
        {
          id: '1',
          tokenName: 'TestToken1',
          tokenAddress: '0x1234567890123456789012345678901234567890',
          totalSupply: '1,000,000',
          bundleWallets: 5,
          liquidityPool: '2.5 ETH / 950k tokens',
          poolValue: '2.5',
          positions: 3,
          totalPnL: '+0.15',
          pnlPercentage: '+6%'
        },
        {
          id: '2',
          tokenName: 'TestToken2',
          tokenAddress: '0x2345678901234567890123456789012345678901',
          totalSupply: '500,000',
          bundleWallets: 3,
          liquidityPool: '1.2 ETH / 450k tokens',
          poolValue: '1.2',
          positions: 2,
          totalPnL: '-0.05',
          pnlPercentage: '-4%'
        }
      ];

      // Calculate real prices and P&L for each launch
      for (const launch of mockLaunches) {
        const priceResult = await this.priceService.getTokenPrice(launch.tokenAddress);
        if (priceResult.success && priceResult.data) {
          // Update pool value based on real price
          const tokenPrice = parseFloat(priceResult.data.price);
          const totalSupply = parseFloat(launch.totalSupply.replace(/,/g, ''));
          const poolValue = (tokenPrice * totalSupply).toFixed(2);
          launch.poolValue = poolValue;
          
          // Calculate P&L based on real price
          const entryPrice = 0.000001; // Mock entry price
          const priceChange = ((tokenPrice - entryPrice) / entryPrice) * 100;
          launch.pnlPercentage = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}%`;
          launch.totalPnL = `${priceChange >= 0 ? '+' : ''}${(priceChange / 100 * parseFloat(launch.poolValue)).toFixed(2)}`;
        }
      }

      return mockLaunches;
    } catch (error) {
      console.error('Error getting launches data:', error);
      return [];
    }
  }

  /**
   * Get positions data for a launch with real calculations
   */
  async getPositionsData(launchId: string): Promise<{ launch: LaunchData; positions: PositionData[] }> {
    try {
      // Get launch data
      const launches = await this.getLaunchesData();
      const launch = launches.find(l => l.id === launchId);
      if (!launch) {
        throw new Error('Launch not found');
      }

      // Mock positions data - in real implementation, this would come from database
      const mockPositions: PositionData[] = [
        {
          walletId: '1',
          walletAddress: '0x1111111111111111111111111111111111111111',
          tokenBalance: '10,000',
          entryValue: '0.1',
          currentValue: '0.12',
          pnl: 0.02,
          pnlPercentage: '+20%'
        },
        {
          walletId: '2',
          walletAddress: '0x2222222222222222222222222222222222222222',
          tokenBalance: '15,000',
          entryValue: '0.15',
          currentValue: '0.18',
          pnl: 0.03,
          pnlPercentage: '+20%'
        },
        {
          walletId: '3',
          walletAddress: '0x3333333333333333333333333333333333333333',
          tokenBalance: '20,000',
          entryValue: '0.25',
          currentValue: '0.35',
          pnl: 0.1,
          pnlPercentage: '+40%'
        }
      ];

      // Calculate real P&L for each position
      const priceResult = await this.priceService.getTokenPrice(launch.tokenAddress);
      if (priceResult.success && priceResult.data) {
        const currentPrice = parseFloat(priceResult.data.price);
        
        for (const position of mockPositions) {
          const tokenBalance = parseFloat(position.tokenBalance.replace(/,/g, ''));
          const entryValue = parseFloat(position.entryValue);
          const entryPrice = entryValue / tokenBalance;
          
          const currentValue = tokenBalance * currentPrice;
          const pnl = currentValue - entryValue;
          const pnlPercentage = (pnl / entryValue) * 100;
          
          position.currentValue = currentValue.toFixed(3);
          position.pnl = pnl;
          position.pnlPercentage = `${pnl >= 0 ? '+' : ''}${pnlPercentage.toFixed(1)}%`;
        }
      }

      return { launch, positions: mockPositions };
    } catch (error) {
      console.error('Error getting positions data:', error);
      throw error;
    }
  }

  /**
   * Get position detail data with real calculations
   */
  async getPositionDetailData(launchId: string, walletId: string): Promise<PositionDetailData> {
    try {
      const { positions } = await this.getPositionsData(launchId);
      const position = positions.find(p => p.walletId === walletId);
      if (!position) {
        throw new Error('Position not found');
      }

      const launches = await this.getLaunchesData();
      const launch = launches.find(l => l.id === launchId);
      if (!launch) {
        throw new Error('Launch not found');
      }

      // Get current price for accurate calculations
      const priceResult = await this.priceService.getTokenPrice(launch.tokenAddress);
      let currentValue = position.currentValue;
      let pnl = position.pnl;
      let pnlPercentage = position.pnlPercentage;

      if (priceResult.success && priceResult.data) {
        const currentPrice = parseFloat(priceResult.data.price);
        const tokenBalance = parseFloat(position.tokenBalance.replace(/,/g, ''));
        const entryValue = parseFloat(position.entryValue);
        
        currentValue = (tokenBalance * currentPrice).toFixed(3);
        pnl = tokenBalance * currentPrice - entryValue;
        pnlPercentage = `${pnl >= 0 ? '+' : ''}${((pnl / entryValue) * 100).toFixed(1)}%`;
      }

      return {
        walletId: position.walletId,
        walletAddress: position.walletAddress,
        tokenBalance: position.tokenBalance,
        entryValue: position.entryValue,
        currentValue,
        pnl,
        pnlPercentage,
        slippage: 2 // Default slippage
      };
    } catch (error) {
      console.error('Error getting position detail data:', error);
      throw error;
    }
  }

  /**
   * Execute a buy trade
   */
  async executeBuyTrade(walletPrivateKey: string, tokenAddress: string, ethAmount: string, slippagePercent: number = 2.5) {
    try {
      const request: BuyTokensRequest = {
        walletPrivateKey,
        tokenAddress,
        ethAmount,
        slippagePercent
      };

      const result = await this.tradingService.buyTokensWithETH(request);
      return result;
    } catch (error) {
      console.error('Error executing buy trade:', error);
      throw error;
    }
  }

  /**
   * Execute a sell trade
   */
  async executeSellTrade(walletPrivateKey: string, tokenAddress: string, tokenAmount: string, slippagePercent: number = 2.5) {
    try {
      const request: SellTokensRequest = {
        walletPrivateKey,
        tokenAddress,
        tokenAmount,
        slippagePercent
      };

      const result = await this.tradingService.sellTokensForETH(request);
      return result;
    } catch (error) {
      console.error('Error executing sell trade:', error);
      throw error;
    }
  }

  /**
   * Get buy quote
   */
  async getBuyQuote(tokenAddress: string, ethAmount: string) {
    try {
      const result = await this.tradingService.getBuyQuote({ tokenAddress, ethAmount });
      return result;
    } catch (error) {
      console.error('Error getting buy quote:', error);
      throw error;
    }
  }

  /**
   * Get sell quote
   */
  async getSellQuote(tokenAddress: string, tokenAmount: string) {
    try {
      const result = await this.tradingService.getSellQuote({ tokenAddress, tokenAmount });
      return result;
    } catch (error) {
      console.error('Error getting sell quote:', error);
      throw error;
    }
  }

  /**
   * Get trade data for confirmation screen
   */
  async getTradeData(launchId: string, walletId: string, mode: 'buy' | 'sell', amount: string): Promise<TradeData> {
    try {
      const { launch } = await this.getPositionsData(launchId);
      const position = await this.getPositionDetailData(launchId, walletId);
      
      let estimatedTokens: string;
      let totalCost: string;
      const slippage = 2.5;
      const gasEstimate = '0.005'; // Mock gas estimate

      if (mode === 'buy') {
        const quoteResult = await this.getBuyQuote(launch.tokenAddress, amount);
        if (quoteResult.success && quoteResult.data) {
          estimatedTokens = quoteResult.data.amountOut;
          totalCost = (parseFloat(amount) + parseFloat(gasEstimate)).toFixed(3);
        } else {
          // Fallback calculation
          estimatedTokens = (parseFloat(amount) * 10000).toFixed(0);
          totalCost = (parseFloat(amount) + parseFloat(gasEstimate)).toFixed(3);
        }
      } else {
        const percentage = parseFloat(amount);
        const tokenBalance = parseFloat(position.tokenBalance.replace(/,/g, ''));
        const tokensToSell = (tokenBalance * percentage / 100).toFixed(0);
        
        const quoteResult = await this.getSellQuote(launch.tokenAddress, tokensToSell);
        if (quoteResult.success && quoteResult.data) {
          estimatedTokens = quoteResult.data.amountOut;
          totalCost = (parseFloat(estimatedTokens) - parseFloat(gasEstimate)).toFixed(3);
        } else {
          // Fallback calculation
          estimatedTokens = (parseFloat(position.currentValue) * percentage / 100).toFixed(3);
          totalCost = (parseFloat(estimatedTokens) - parseFloat(gasEstimate)).toFixed(3);
        }
      }

      return {
        launchId,
        walletId,
        mode,
        amount,
        estimatedTokens,
        slippage,
        gasEstimate,
        totalCost
      };
    } catch (error) {
      console.error('Error getting trade data:', error);
      throw error;
    }
  }

  /**
   * Get wallet private key (mock implementation)
   * In real implementation, this would decrypt from database
   */
  async getWalletPrivateKey(walletId: string): Promise<string> {
    // Mock implementation - in real app, this would decrypt from database
    return '0x1234567890123456789012345678901234567890123456789012345678901234';
  }

  /**
   * Get Uniswap router address based on network
   */
  private getUniswapRouterAddress(): string {
    return this.network === 'mainnet' 
      ? '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
      : '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // Same for testnet
  }

  /**
   * Get Uniswap factory address based on network
   */
  private getUniswapFactoryAddress(): string {
    return this.network === 'mainnet'
      ? '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
      : '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'; // Same for testnet
  }

  /**
   * Get WETH address based on network
   */
  private getWethAddress(): string {
    return this.network === 'mainnet'
      ? '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
      : '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'; // Goerli WETH
  }
} 