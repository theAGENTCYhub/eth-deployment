import { BotContext } from '../../types';
import { LaunchesScreens } from '../../screens/launches/launches.screens';
import { LaunchesKeyboards } from '../../keyboards/launches/launches.keyboards';
import { BotScreens } from '../../screens';
import { TradingServiceManager, ServiceManagerConfig } from '../../../services/trading-service-manager';
import { ethers } from 'ethers';

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

export class PositionDetailHandler {
  /**
   * Show position detail screen
   */
  static async showPositionDetail(ctx: BotContext, launchId: string, walletId: string, mode: 'buy' | 'sell' = 'buy') {
    try {
      ctx.session.currentScreen = 'position_detail';
      ctx.session.currentLaunchId = launchId;
      ctx.session.currentPositionId = walletId;
      ctx.session.tradingMode = mode;

      // Initialize service manager
      const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545');
      const serviceConfig: ServiceManagerConfig = {
        provider,
        network: 'testnet' as const,
        userId: ctx.from?.id?.toString() || 'unknown'
      };
      const serviceManager = new TradingServiceManager(serviceConfig);

      // Get real position data with price calculations
      const position = await serviceManager.getPositionDetailData(launchId, walletId);

      const screen = LaunchesScreens.getPositionDetailScreen(position, mode);
      const keyboard = mode === 'buy' 
        ? LaunchesKeyboards.getPositionDetailBuyKeyboard(launchId, walletId)
        : LaunchesKeyboards.getPositionDetailSellKeyboard(launchId, walletId);

      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error showing position detail:', error);
      await ctx.answerCbQuery('❌ Failed to load position details');
    }
  }

  /**
   * Handle trading mode switch
   */
  static async switchTradingMode(ctx: BotContext, launchId: string, walletId: string, mode: 'buy' | 'sell') {
    await this.showPositionDetail(ctx, launchId, walletId, mode);
  }

  /**
   * Handle buy trade initiation
   */
  static async initiateBuyTrade(ctx: BotContext, launchId: string, walletId: string, amount: string) {
    try {
      // Initialize service manager
      const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545');
      const serviceConfig: ServiceManagerConfig = {
        provider,
        network: 'testnet' as const,
        userId: ctx.from?.id?.toString() || 'unknown'
      };
      const serviceManager = new TradingServiceManager(serviceConfig);

      // Get real trade data with quote calculations
      const tradeData = await serviceManager.getTradeData(launchId, walletId, 'buy', amount);

      const screen = LaunchesScreens.getTradingConfirmationScreen(tradeData);
      const keyboard = LaunchesKeyboards.getTradingConfirmationKeyboard(tradeData);

      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error initiating buy trade:', error);
      await ctx.answerCbQuery('❌ Failed to initiate trade');
    }
  }

  /**
   * Handle sell trade initiation
   */
  static async initiateSellTrade(ctx: BotContext, launchId: string, walletId: string, percentage: string) {
    try {
      // Initialize service manager
      const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545');
      const serviceConfig: ServiceManagerConfig = {
        provider,
        network: 'testnet' as const,
        userId: ctx.from?.id?.toString() || 'unknown'
      };
      const serviceManager = new TradingServiceManager(serviceConfig);

      // Get real trade data with quote calculations
      const tradeData = await serviceManager.getTradeData(launchId, walletId, 'sell', percentage);

      const screen = LaunchesScreens.getTradingConfirmationScreen(tradeData);
      const keyboard = LaunchesKeyboards.getTradingConfirmationKeyboard(tradeData);

      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error initiating sell trade:', error);
      await ctx.answerCbQuery('❌ Failed to initiate trade');
    }
  }

  /**
   * Handle slippage configuration
   */
  static async showSlippageConfig(ctx: BotContext, launchId: string, walletId: string) {
    try {
      const currentSlippage = 2; // Mock current slippage

      const screen = {
        title: "⚙️ Slippage Configuration",
        description: `
*Current Slippage: ${currentSlippage}%*

Slippage is the maximum price movement you're willing to accept for your trade.

**Slippage Options:**
• **0.5%** - Very tight, may fail on volatile tokens
• **1%** - Standard for most trades
• **2%** - Recommended for new tokens
• **5%** - Higher tolerance for price movement
• **10%** - Maximum tolerance, rarely fails

*Select your preferred slippage:*
        `,
        footer: "Lower slippage = better price, but higher chance of failure"
      };

      const keyboard = LaunchesKeyboards.getSlippageKeyboard(launchId, walletId, currentSlippage);

      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error showing slippage config:', error);
      await ctx.answerCbQuery('❌ Failed to load slippage options');
    }
  }

  /**
   * Handle position refresh
   */
  static async refreshPosition(ctx: BotContext, launchId: string, walletId: string) {
    try {
      // Mock refresh - will be replaced with real data fetching
      await ctx.answerCbQuery('🔄 Position data refreshed!');
      
      // Re-show the position detail with updated data
      const currentMode = ctx.session.tradingMode || 'buy';
      await this.showPositionDetail(ctx, launchId, walletId, currentMode);
    } catch (error) {
      console.error('Error refreshing position:', error);
      await ctx.answerCbQuery('❌ Failed to refresh position');
    }
  }
} 