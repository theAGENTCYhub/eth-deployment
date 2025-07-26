import { Markup } from 'telegraf';
import { LaunchData } from '../../screens/launches/launches.screens';
import { CallbackManager } from '../../callbacks';

export class LaunchesKeyboards {
  /**
   * Get the main launches list keyboard
   */
  static getLaunchesListKeyboard(launches: LaunchData[] = [], currentPage: number = 1, totalPages: number = 1) {
    const buttons = [];

    // Add launch buttons (max 5 per page)
    const startIndex = (currentPage - 1) * 5;
    const endIndex = Math.min(startIndex + 5, launches.length);
    const pageLaunches = launches.slice(startIndex, endIndex);

    pageLaunches.forEach((launch, index) => {
      const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
      const buttonText = `${launch.tokenName} (${shortAddress})`;
      const callbackId = CallbackManager.generateLaunchDetailCallback(launch.id);
      buttons.push([Markup.button.callback(buttonText, callbackId)]);
    });

    // Add pagination if needed
    if (totalPages > 1) {
      const paginationRow = [];
      if (currentPage > 1) {
        const prevCallbackId = CallbackManager.generateLaunchesPageCallback(currentPage - 1);
        paginationRow.push(Markup.button.callback('◀️ Previous', prevCallbackId));
      }
      if (currentPage < totalPages) {
        const nextCallbackId = CallbackManager.generateLaunchesPageCallback(currentPage + 1);
        paginationRow.push(Markup.button.callback('▶️ Next', nextCallbackId));
      }
      if (paginationRow.length > 0) {
        buttons.push(paginationRow);
      }
    }

    // Add back button
    buttons.push([Markup.button.callback('🏠 Back to Home', 'action_home')]);

    return Markup.inlineKeyboard(buttons);
  }

  /**
   * Get launch management keyboard
   */
  static getLaunchManagementKeyboard(launchId: string) {
    const managementCallbackId = CallbackManager.generateLaunchManagementCallback(launchId);
    const positionsCallbackId = CallbackManager.generateLaunchPositionsCallback(launchId);
    
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('⚙️ Management', managementCallbackId),
        Markup.button.callback('📈 Positions', positionsCallbackId)
      ],
      [Markup.button.callback('🔙 Back to Launches', 'action_launches')]
    ]);
  }

  /**
   * Get positions list keyboard
   */
  static getPositionsListKeyboard(launchId: string, positions: any[] = [], currentPage: number = 1, totalPages: number = 1) {
    const buttons = [];

    // Add position buttons (max 5 per page)
    const startIndex = (currentPage - 1) * 5;
    const endIndex = Math.min(startIndex + 5, positions.length);
    const pagePositions = positions.slice(startIndex, endIndex);

    pagePositions.forEach((position, index) => {
      const shortWallet = `${position.walletAddress.slice(0, 6)}...${position.walletAddress.slice(-4)}`;
      const pnlColor = position.pnl >= 0 ? '🟢' : '🔴';
      const buttonText = `${shortWallet}: ${pnlColor} ${position.pnl} ETH`;
      buttons.push([Markup.button.callback(buttonText, `position_detail_${launchId}_${position.walletId}`)]);
    });

    // Add pagination if needed
    if (totalPages > 1) {
      const paginationRow = [];
      if (currentPage > 1) {
        paginationRow.push(Markup.button.callback('◀️ Previous', `positions_page_${launchId}_${currentPage - 1}`));
      }
      if (currentPage < totalPages) {
        paginationRow.push(Markup.button.callback('▶️ Next', `positions_page_${launchId}_${currentPage + 1}`));
      }
      if (paginationRow.length > 0) {
        buttons.push(paginationRow);
      }
    }

    // Add back button
    buttons.push([Markup.button.callback('🔙 Back to Launch', `launch_detail_${launchId}`)]);

    return Markup.inlineKeyboard(buttons);
  }

  /**
   * Get position detail keyboard (buy mode)
   */
  static getPositionDetailBuyKeyboard(launchId: string, walletId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('💵 0.05 ETH', `trade_buy_${launchId}_${walletId}_0.05`),
        Markup.button.callback('💵 0.1 ETH', `trade_buy_${launchId}_${walletId}_0.1`)
      ],
      [
        Markup.button.callback('💵 0.25 ETH', `trade_buy_${launchId}_${walletId}_0.25`),
        Markup.button.callback('💵 0.5 ETH', `trade_buy_${launchId}_${walletId}_0.5`)
      ],
      [Markup.button.callback('💵 Custom Amount', `trade_buy_custom_${launchId}_${walletId}`)],
      [Markup.button.callback('📈 Switch to SELL', `position_mode_sell_${launchId}_${walletId}`)],
      [
        Markup.button.callback('⚙️ Slippage', `trade_slippage_${launchId}_${walletId}`),
        Markup.button.callback('🔄 Refresh', `position_refresh_${launchId}_${walletId}`)
      ],
      [Markup.button.callback('🔙 Back to Positions', `launch_positions_${launchId}`)]
    ]);
  }

  /**
   * Get position detail keyboard (sell mode)
   */
  static getPositionDetailSellKeyboard(launchId: string, walletId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📉 10%', `trade_sell_${launchId}_${walletId}_10`),
        Markup.button.callback('📉 25%', `trade_sell_${launchId}_${walletId}_25`)
      ],
      [
        Markup.button.callback('📉 50%', `trade_sell_${launchId}_${walletId}_50`),
        Markup.button.callback('📉 100%', `trade_sell_${launchId}_${walletId}_100`)
      ],
      [Markup.button.callback('📉 Custom %', `trade_sell_custom_${launchId}_${walletId}`)],
      [Markup.button.callback('💵 Switch to BUY', `position_mode_buy_${launchId}_${walletId}`)],
      [
        Markup.button.callback('⚙️ Slippage', `trade_slippage_${launchId}_${walletId}`),
        Markup.button.callback('🔄 Refresh', `position_refresh_${launchId}_${walletId}`)
      ],
      [Markup.button.callback('🔙 Back to Positions', `launch_positions_${launchId}`)]
    ]);
  }

  /**
   * Get trading confirmation keyboard
   */
  static getTradingConfirmationKeyboard(tradeData: any) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Confirm', `trade_confirm_${tradeData.launchId}_${tradeData.walletId}_${tradeData.mode}_${tradeData.amount}`),
        Markup.button.callback('❌ Cancel', `trade_cancel_${tradeData.launchId}_${tradeData.walletId}`)
      ]
    ]);
  }

  /**
   * Get trading success keyboard
   */
  static getTradingSuccessKeyboard(launchId: string, walletId: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Back to Position', `position_detail_${launchId}_${walletId}`)],
      [Markup.button.callback('📈 View All Positions', `launch_positions_${launchId}`)]
    ]);
  }

  /**
   * Get slippage configuration keyboard
   */
  static getSlippageKeyboard(launchId: string, walletId: string, currentSlippage: number = 2) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('0.5%', `slippage_set_${launchId}_${walletId}_0.5`),
        Markup.button.callback('1%', `slippage_set_${launchId}_${walletId}_1`),
        Markup.button.callback('2%', `slippage_set_${launchId}_${walletId}_2`)
      ],
      [
        Markup.button.callback('5%', `slippage_set_${launchId}_${walletId}_5`),
        Markup.button.callback('10%', `slippage_set_${launchId}_${walletId}_10`),
        Markup.button.callback('Custom', `slippage_custom_${launchId}_${walletId}`)
      ],
      [Markup.button.callback('🔙 Back', `position_detail_${launchId}_${walletId}`)]
    ]);
  }

  /**
   * Get empty launches keyboard (for when no launches exist)
   */
  static getEmptyLaunchesKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🚀 Deploy Token', 'action_deploy'),
        Markup.button.callback('🎯 Bundle Launch', 'action_bundle_launch')
      ],
      [Markup.button.callback('🏠 Back to Home', 'action_home')]
    ]);
  }
} 