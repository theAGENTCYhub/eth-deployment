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
      // Get real launch data from database
      const { BundleLaunchesService } = await import('@eth-deployer/supabase');
      const service = new BundleLaunchesService();
      const result = await service.getBundleLaunchesByUserId(this.userId);
      
      if (!result.success || !result.data) {
        console.error('Failed to get launches data:', result.error);
        return [];
      }
      
      // Transform database data to UI format
      const launches: LaunchData[] = await Promise.all(
        result.data.map(async (launch) => {
          // Get positions count for this launch
          const positionsResult = await service.getPositionsByLaunchId(launch.id);
          const positionsCount = positionsResult.success && positionsResult.data ? positionsResult.data.length : 0;
          
          // Get bundle wallets count
          const walletsResult = await service.getBundleWalletsByLaunchId(launch.id);
          const bundleWalletsCount = walletsResult.success && walletsResult.data ? walletsResult.data.length : 0;
          
          // Calculate real prices and P&L
          const priceResult = await this.priceService.getTokenPrice(launch.token_address);
          let poolValue = '0';
          let totalPnL = '0';
          let pnlPercentage = '0%';
          
          if (priceResult.success && priceResult.data) {
            const tokenPrice = parseFloat(priceResult.data.price);
            
            // Use a more reasonable pool value calculation
            // Instead of multiplying by total supply, use the liquidity ETH amount from the launch
            const liquidityEth = parseFloat(launch.liquidity_eth_amount || '0');
            poolValue = liquidityEth.toFixed(2);
            
            // Calculate P&L based on real price (assuming entry price from launch)
            const entryPrice = 0.000001; // This should come from launch data
            const priceChange = ((tokenPrice - entryPrice) / entryPrice) * 100;
            pnlPercentage = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}%`;
            totalPnL = `${priceChange >= 0 ? '+' : ''}${(priceChange / 100 * liquidityEth).toFixed(2)}`;
          }
          
          return {
            id: launch.id,
            tokenName: launch.token_name,
            tokenAddress: launch.token_address,
            totalSupply: launch.token_total_supply || '0',
            bundleWallets: bundleWalletsCount,
            liquidityPool: `${poolValue} ETH / ${launch.token_total_supply || '0'} tokens`,
            poolValue,
            positions: positionsCount,
            totalPnL,
            pnlPercentage
          };
        })
      );

      return launches;
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

      // Get real positions data from database
      const { PositionsRepository } = await import('@eth-deployer/supabase');
      const repo = new PositionsRepository();
      const result = await repo.getByLaunchId(launchId);
      
      if (!result.success || !result.data) {
        console.error('Failed to get positions data:', result.error);
        return { launch, positions: [] };
      }
      
      // Transform database positions to UI format
      const positions: PositionData[] = await Promise.all(
        result.data.map(async (position) => {
          // Calculate real P&L for each position
          const priceResult = await this.priceService.getTokenPrice(launch.tokenAddress);
          let currentValue = '0';
          let pnl = 0;
          let pnlPercentage = '0%';
          
          if (priceResult.success && priceResult.data) {
            const currentPrice = parseFloat(priceResult.data.price);
            const tokenBalance = parseFloat(position.amount || '0');
            const entryValue = parseFloat(position.eth_spent || '0');
            
            currentValue = (tokenBalance * currentPrice).toFixed(3);
            pnl = tokenBalance * currentPrice - entryValue;
            pnlPercentage = `${pnl >= 0 ? '+' : ''}${((pnl / entryValue) * 100).toFixed(1)}%`;
          }
          
          return {
            walletId: position.id,
            walletAddress: position.wallet_address,
            tokenBalance: position.amount || '0',
            entryValue: position.eth_spent || '0',
            currentValue,
            pnl,
            pnlPercentage
          };
        })
      );

      return { launch, positions };
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
   * Get wallet private key from database
   */
  async getWalletPrivateKey(walletId: string): Promise<string> {
    try {
      const { WalletService } = await import('@eth-deployer/supabase');
      const walletService = new WalletService();
      const result = await walletService.exportPrivateKey(walletId);
      
      if (!result.success || !result.privateKey) {
        throw new Error(`Failed to get private key: ${result.error}`);
      }
      
      return result.privateKey;
    } catch (error) {
      console.error('Error getting wallet private key:', error);
      throw error;
    }
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

  getProvider(): ethers.providers.Provider {
    return this.provider;
  }
} 