import { BotContext } from '../../types';
import { LaunchesScreens, LaunchData } from '../../screens/launches/launches.screens';
import { LaunchesKeyboards } from '../../keyboards/launches/launches.keyboards';
import { BotScreens } from '../../screens';
import { TradingServiceManager, ServiceManagerConfig } from '../../../services/trading-service-manager';
import { ethers } from 'ethers';

export class LaunchesHandler {
  /**
   * Show the main launches list screen
   */
  static async showLaunchesList(ctx: BotContext, page: number = 1) {
    try {
      ctx.session.currentScreen = 'launches_list';
      ctx.session.launchesPage = page;

      // Initialize service manager
      const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545');
      const serviceConfig: ServiceManagerConfig = {
        provider,
        network: 'testnet' as const,
        userId: ctx.from?.id?.toString() || 'unknown'
      };
      const serviceManager = new TradingServiceManager(serviceConfig);

      // Get real launches data with price calculations
      const launches = await serviceManager.getLaunchesData();

      const totalLaunches = launches.length;
      const activePositions = launches.reduce((sum, launch) => sum + launch.positions, 0);
      const totalValue = launches.reduce((sum, launch) => sum + parseFloat(launch.poolValue), 0).toFixed(2);

      // Pagination logic
      const launchesPerPage = 5;
      const totalPages = Math.ceil(totalLaunches / launchesPerPage);
      const startIndex = (page - 1) * launchesPerPage;
      const endIndex = startIndex + launchesPerPage;
      const pageLaunches = launches.slice(startIndex, endIndex);

      const screen = LaunchesScreens.getLaunchesListScreen(pageLaunches, totalLaunches, activePositions, totalValue);
      const keyboard = pageLaunches.length > 0 
        ? LaunchesKeyboards.getLaunchesListKeyboard(launches, page, totalPages)
        : LaunchesKeyboards.getEmptyLaunchesKeyboard();

      const message = BotScreens.formatScreen(screen);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
      }
    } catch (error) {
      console.error('Error showing launches list:', error);
      await ctx.reply('❌ Failed to load launches. Please try again.');
    }
  }

  /**
   * Show launch detail screen
   */
  static async showLaunchDetail(ctx: BotContext, launchId: string) {
    try {
      ctx.session.currentScreen = 'launch_detail';
      ctx.session.currentLaunchId = launchId;

      // Initialize service manager
      const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545');
      const serviceConfig: ServiceManagerConfig = {
        provider,
        network: 'testnet' as const,
        userId: ctx.from?.id?.toString() || 'unknown'
      };
      const serviceManager = new TradingServiceManager(serviceConfig);

      // Get real launch data with price calculations
      const launches = await serviceManager.getLaunchesData();
      const launch = launches.find(l => l.id === launchId);
      
      if (!launch) {
        await ctx.answerCbQuery('❌ Launch not found');
        return;
      }

      const screen = LaunchesScreens.getLaunchManagementScreen(launch);
      const keyboard = LaunchesKeyboards.getLaunchManagementKeyboard(launchId);

      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error showing launch detail:', error);
      await ctx.answerCbQuery('❌ Failed to load launch details');
    }
  }

  /**
   * Show launch management screen
   */
  static async showLaunchManagement(ctx: BotContext, launchId: string) {
    try {
      const { LaunchManagementHandler } = await import('./launch-management.handler');
      await LaunchManagementHandler.showLaunchDetail(ctx, launchId);
    } catch (error) {
      console.error('Error showing launch management:', error);
      await ctx.answerCbQuery('❌ Failed to load management options');
    }
  }

  /**
   * Handle pagination for launches list
   */
  static async handleLaunchesPagination(ctx: BotContext, page: number) {
    await this.showLaunchesList(ctx, page);
  }
} 