import { Markup } from 'telegraf';
import { CallbackManager } from '../callbacks';

export class LaunchManagementKeyboards {
  /**
   * Get the main management keyboard
   */
  static getManagementKeyboard(launchId: string) {
    const addLiquidityCallbackId = CallbackManager.generateCallbackId('management_add_liquidity', { launchId });
    const removeLiquidityCallbackId = CallbackManager.generateCallbackId('management_remove_liquidity', { launchId });
    const closeTradingCallbackId = CallbackManager.generateCallbackId('management_close_trading', { launchId });
    const updateLimitsCallbackId = CallbackManager.generateCallbackId('management_update_limits', { launchId });
    const positionsCallbackId = CallbackManager.generateLaunchPositionsCallback(launchId);
    const backCallbackId = CallbackManager.generateLaunchDetailCallback(launchId);
    
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('💧 Add Liquidity', addLiquidityCallbackId),
        Markup.button.callback('📤 Remove Liquidity', removeLiquidityCallbackId)
      ],
      [
        Markup.button.callback('🔒 Close Trading', closeTradingCallbackId),
        Markup.button.callback('⚙️ Update Limits', updateLimitsCallbackId)
      ],
      [
        Markup.button.callback('📈 Positions', positionsCallbackId)
      ],
      [
        Markup.button.callback('🔙 Back to Launch', backCallbackId)
      ]
    ]);
  }

  /**
   * Get add liquidity keyboard
   */
  static getAddLiquidityKeyboard(launchId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('💧 0.1 ETH', `add_liquidity_${launchId}_0.1`),
        Markup.button.callback('💧 0.5 ETH', `add_liquidity_${launchId}_0.5`)
      ],
      [
        Markup.button.callback('💧 1.0 ETH', `add_liquidity_${launchId}_1.0`),
        Markup.button.callback('💧 2.0 ETH', `add_liquidity_${launchId}_2.0`)
      ],
      [
        Markup.button.callback('🔙 Back to Management', `launch_management_${launchId}`)
      ]
    ]);
  }

  /**
   * Get remove liquidity keyboard
   */
  static getRemoveLiquidityKeyboard(launchId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📤 25%', `remove_liquidity_${launchId}_25`),
        Markup.button.callback('📤 50%', `remove_liquidity_${launchId}_50`)
      ],
      [
        Markup.button.callback('📤 75%', `remove_liquidity_${launchId}_75`),
        Markup.button.callback('📤 100%', `remove_liquidity_${launchId}_100`)
      ],
      [
        Markup.button.callback('🔙 Back to Management', `launch_management_${launchId}`)
      ]
    ]);
  }

  /**
   * Get close trading confirmation keyboard
   */
  static getCloseTradingKeyboard(launchId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Confirm Close', `confirm_close_trading_${launchId}`),
        Markup.button.callback('❌ Cancel', `launch_management_${launchId}`)
      ]
    ]);
  }

  /**
   * Get update limits keyboard
   */
  static getUpdateLimitsKeyboard(launchId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📈 Max Buy', `update_max_buy_${launchId}`),
        Markup.button.callback('📉 Max Sell', `update_max_sell_${launchId}`)
      ],
      [
        Markup.button.callback('⚙️ Slippage', `update_slippage_${launchId}`),
        Markup.button.callback('💰 Price Limits', `update_price_limits_${launchId}`)
      ],
      [
        Markup.button.callback('🔙 Back to Management', `launch_management_${launchId}`)
      ]
    ]);
  }

  /**
   * Get back to management keyboard
   */
  static getBackToManagementKeyboard(launchId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🔙 Back to Management', `launch_management_${launchId}`)
      ]
    ]);
  }
} 