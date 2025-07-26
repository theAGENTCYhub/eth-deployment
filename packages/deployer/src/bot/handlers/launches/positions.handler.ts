import { BotContext } from '../../types';
import { LaunchesScreens, LaunchData } from '../../screens/launches/launches.screens';
import { LaunchesKeyboards } from '../../keyboards/launches/launches.keyboards';
import { BotScreens } from '../../screens';
import { TradingServiceManager, ServiceManagerConfig } from '../../../services/trading-service-manager';
import { ethers } from 'ethers';

export interface PositionData {
  walletId: string;
  walletAddress: string;
  tokenBalance: string;
  entryValue: string;
  currentValue: string;
  pnl: number;
  pnlPercentage: string;
}

export class PositionsHandler {
  /**
   * Show positions list for a specific launch
   */
  static async showPositionsList(ctx: BotContext, launchId: string, page: number = 1) {
    try {
      ctx.session.currentScreen = 'positions_list';
      ctx.session.currentLaunchId = launchId;
      ctx.session.positionsPage = page;

      // Initialize service manager
      const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545');
      const serviceConfig: ServiceManagerConfig = {
        provider,
        network: 'testnet' as const,
        userId: ctx.from?.id?.toString() || 'unknown'
      };
      const serviceManager = new TradingServiceManager(serviceConfig);

      // Get real positions data with price calculations
      const { launch, positions } = await serviceManager.getPositionsData(launchId);

      // Pagination logic
      const positionsPerPage = 5;
      const totalPages = Math.ceil(positions.length / positionsPerPage);
      const startIndex = (page - 1) * positionsPerPage;
      const endIndex = startIndex + positionsPerPage;
      const pagePositions = positions.slice(startIndex, endIndex);

      const screen = LaunchesScreens.getPositionsListScreen(launch, pagePositions, page, totalPages);
      const keyboard = LaunchesKeyboards.getPositionsListKeyboard(launchId, positions, page, totalPages);

      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error showing positions list:', error);
      await ctx.answerCbQuery('❌ Failed to load positions');
    }
  }

  /**
   * Handle pagination for positions list
   */
  static async handlePositionsPagination(ctx: BotContext, launchId: string, page: number) {
    await this.showPositionsList(ctx, launchId, page);
  }
} 