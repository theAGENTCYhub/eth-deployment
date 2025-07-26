import { BotContext } from '../../types';
import { LaunchManagementScreens } from '../../screens/launch-management.screens';
import { LaunchManagementKeyboards } from '../../keyboards/launch-management.keyboards';
import { BotScreens } from '../../screens';
import { TradingServiceManager, ServiceManagerConfig } from '../../../services/trading-service-manager';
import { ethers } from 'ethers';

export class LaunchManagementHandler {
  /**
   * Show the launch management screen
   */
  static async showManagementScreen(ctx: BotContext, launchId: string) {
    try {
      ctx.session.currentScreen = 'launch_management';
      ctx.session.currentLaunchId = launchId;

      // Initialize service manager
      const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545');
      const serviceConfig: ServiceManagerConfig = {
        provider,
        network: 'testnet' as const,
        userId: ctx.from?.id?.toString() || 'unknown'
      };
      const serviceManager = new TradingServiceManager(serviceConfig);

      // Get real launch data
      const launches = await serviceManager.getLaunchesData();
      const launch = launches.find(l => l.id === launchId);
      
      if (!launch) {
        await ctx.answerCbQuery('❌ Launch not found');
        return;
      }

      // Get positions data for this launch
      const { launch: launchData, positions } = await serviceManager.getPositionsData(launchId);

      const screen = LaunchManagementScreens.getManagementScreen(launchData, positions);
      const keyboard = LaunchManagementKeyboards.getManagementKeyboard(launchId);

      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error showing launch management:', error);
      await ctx.answerCbQuery('❌ Failed to load management options');
    }
  }

  /**
   * Handle add liquidity action
   */
  static async addLiquidity(ctx: BotContext, launchId: string) {
    try {
      // This would integrate with the liquidity management service
      await ctx.answerCbQuery('💧 Add liquidity functionality coming soon!');
    } catch (error) {
      console.error('Error adding liquidity:', error);
      await ctx.answerCbQuery('❌ Failed to add liquidity');
    }
  }

  /**
   * Handle remove liquidity action
   */
  static async removeLiquidity(ctx: BotContext, launchId: string) {
    try {
      // This would integrate with the liquidity management service
      await ctx.answerCbQuery('📤 Remove liquidity functionality coming soon!');
    } catch (error) {
      console.error('Error removing liquidity:', error);
      await ctx.answerCbQuery('❌ Failed to remove liquidity');
    }
  }

  /**
   * Handle close trading action
   */
  static async closeTrading(ctx: BotContext, launchId: string) {
    try {
      // This would integrate with the trading service to close trading
      await ctx.answerCbQuery('🔒 Close trading functionality coming soon!');
    } catch (error) {
      console.error('Error closing trading:', error);
      await ctx.answerCbQuery('❌ Failed to close trading');
    }
  }

  /**
   * Handle update limits action
   */
  static async updateLimits(ctx: BotContext, launchId: string) {
    try {
      // This would allow updating trading limits
      await ctx.answerCbQuery('⚙️ Update limits functionality coming soon!');
    } catch (error) {
      console.error('Error updating limits:', error);
      await ctx.answerCbQuery('❌ Failed to update limits');
    }
  }
} 