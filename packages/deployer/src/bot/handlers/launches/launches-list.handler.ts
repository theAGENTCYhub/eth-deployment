import { BotContext } from '../../types';
import { LaunchesListScreens } from '../../screens/launches/launches-list.screens';
import { LaunchesListKeyboards } from '../../keyboards/launches/launches-list.keyboards';
import { BotScreens } from '../../screens';

export interface LaunchSummary {
  id: string;
  shortId: string;
  tokenName: string;
  tokenSymbol?: string;
  tokenAddress: string;
  status: 'not_launched' | 'configuring' | 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  poolValue?: string;
  tradingOpen?: boolean;
  positionsCount?: number;
  createdAt: string;
  error?: string;
}

export class LaunchesListHandler {
  /**
   * Show all launches for user
   */
  static async showLaunchesList(ctx: BotContext, page: number = 0) {
    try {
      if (!ctx.from) {
        await ctx.reply('❌ User information not available.');
        return;
      }

      const userId = ctx.from.id.toString();
      
      // Get all launches for user
      const launchesResult = await this.getUserLaunches(userId);
      
      if (!launchesResult.success) {
        await ctx.reply(`❌ Failed to load launches: ${launchesResult.error}`);
        return;
      }

      const launches = launchesResult.data || [];

      // Group launches by status
      const groupedLaunches = this.groupLaunchesByStatus(launches);

      // Calculate pagination
      const itemsPerPage = 10;
      const totalItems = launches.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const hasMore = page < totalPages - 1;
      const hasPrev = page > 0;

      // Get launches for current page
      const startIndex = page * itemsPerPage;
      const pageItems = launches.slice(startIndex, startIndex + itemsPerPage);

      const screen = LaunchesListScreens.getLaunchesListScreen(
        groupedLaunches,
        page,
        totalPages,
        totalItems
      );
      
      const keyboard = LaunchesListKeyboards.getLaunchesListKeyboard(
        pageItems,
        page,
        hasMore,
        hasPrev
      );

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

      // Update session
      ctx.session.currentScreen = 'launches_list';
      ctx.session.launchesState = {
        currentPage: page,
        totalPages: totalPages,
        launches: pageItems
      };

    } catch (error) {
      console.error('Error showing launches list:', error);
      await ctx.reply('❌ Failed to load launches. Please try again.');
    }
  }

  /**
   * Get all launches for a user
   */
  private static async getUserLaunches(userId: string): Promise<{
    success: boolean;
    data?: LaunchSummary[];
    error?: string;
  }> {
    try {
      const { TokenLaunchesService } = await import('@eth-deployer/supabase');
      const launchesService = new TokenLaunchesService();
      
      const result = await launchesService.getUserLaunches(userId);
      
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'No launches found' };
      }

      // Transform database records to LaunchSummary format
      const launches: LaunchSummary[] = result.data.map(launch => ({
        id: launch.id,
        shortId: launch.short_id,
        tokenName: launch.token_name,
        tokenSymbol: this.extractTokenSymbol(launch.token_name),
        tokenAddress: launch.token_address,
        status: launch.status as any,
        poolValue: launch.status === 'completed' ? this.formatPoolValue(launch) : undefined,
        tradingOpen: launch.status === 'completed',
        positionsCount: 0, // TODO: Get from positions table
        createdAt: launch.created_at,
        error: launch.error_message || undefined
      }));

      return { success: true, data: launches };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get launches'
      };
    }
  }

  /**
   * Group launches by status
   */
  private static groupLaunchesByStatus(launches: LaunchSummary[]) {
    return {
      notLaunched: launches.filter(l => l.status === 'not_launched'),
      configuring: launches.filter(l => l.status === 'configuring'),
      pending: launches.filter(l => l.status === 'pending'),
      executing: launches.filter(l => l.status === 'executing'),
      active: launches.filter(l => l.status === 'completed'),
      failed: launches.filter(l => l.status === 'failed'),
      cancelled: launches.filter(l => l.status === 'cancelled')
    };
  }

  /**
   * Extract token symbol from name (if available)
   */
  private static extractTokenSymbol(tokenName: string): string {
    // Try to extract symbol from token name like "MyToken (MTK)"
    const match = tokenName.match(/\(([^)]+)\)$/);
    return match ? match[1] : tokenName.substring(0, 4).toUpperCase();
  }

  /**
   * Format pool value for display
   */
  private static formatPoolValue(launch: any): string {
    // TODO: Get actual pool value from blockchain or cache
    return launch.liquidity_eth_amount ? 
      `${parseFloat(launch.liquidity_eth_amount).toFixed(2)} ETH` : 
      'Unknown';
  }

  /**
   * Handle pagination
   */
  static async handleLaunchesPagination(ctx: BotContext, page: number) {
    await this.showLaunchesList(ctx, page);
  }
} 