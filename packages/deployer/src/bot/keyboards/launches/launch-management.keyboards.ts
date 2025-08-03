import { Markup } from 'telegraf';
import { LaunchDetails } from '../../handlers/launches/launch-management.handler';

export class LaunchManagementKeyboards {
  /**
   * Get context-aware management keyboard
   */
  static getManagementKeyboard(launch: LaunchDetails, positionsCount: number = 0) {
    const buttons = [];

    // Row 1: Navigation buttons (lead to other screens)
    buttons.push([
      Markup.button.callback(`📊 Positions (${positionsCount})`, `launch_positions_${launch.id}`),
      Markup.button.callback('💰 Buy Tokens', `launch_buy_${launch.id}`)
    ]);
    
    buttons.push([
      Markup.button.callback('🎯 Bundle Launch', `launch_bundle_${launch.id}`)
    ]);

    // Action buttons (adapt based on launch state)
    const actionButtons = this.getActionButtons(launch);
    actionButtons.forEach(row => buttons.push(row));

    // Navigation buttons
    buttons.push([
      Markup.button.callback('🔙 Back to Launches', 'action_launches'),
      Markup.button.callback('🏠 Home', 'action_home')
    ]);

    return Markup.inlineKeyboard(buttons);
  }

  /**
   * Get action buttons based on launch state
   */
  private static getActionButtons(launch: LaunchDetails) {
    const buttons = [];

    switch (launch.status) {
      case 'not_launched':
        buttons.push([
          Markup.button.callback('💧 Create Pool & Add Liquidity', `launch_create_liquidity_${launch.id}`)
        ]);
        buttons.push([
          Markup.button.callback('⚙️ Contract Settings', `launch_contract_settings_${launch.id}`),
          Markup.button.callback('📊 Analytics', `launch_analytics_${launch.id}`)
        ]);
        break;

      case 'configuring':
        buttons.push([
          Markup.button.callback('⚙️ Configure Launch', `launch_configure_${launch.id}`)
        ]);
        buttons.push([
          Markup.button.callback('💧 Set Liquidity', `launch_set_liquidity_${launch.id}`),
          Markup.button.callback('🎯 Bundle Settings', `launch_bundle_settings_${launch.id}`)
        ]);
        break;

      case 'pending':
        buttons.push([
          Markup.button.callback('🚀 Execute Launch', `launch_execute_${launch.id}`)
        ]);
        buttons.push([
          Markup.button.callback('⚙️ Modify Settings', `launch_modify_${launch.id}`),
          Markup.button.callback('❌ Cancel Launch', `launch_cancel_${launch.id}`)
        ]);
        break;

      case 'executing':
        buttons.push([
          Markup.button.callback('🔄 Check Status', `launch_status_${launch.id}`)
        ]);
        buttons.push([
          Markup.button.callback('❌ Cancel Execution', `launch_cancel_execution_${launch.id}`)
        ]);
        break;

      case 'completed':
        buttons.push([
          Markup.button.callback('💧 Manage Liquidity', `launch_manage_liquidity_${launch.id}`)
        ]);
        buttons.push([
          Markup.button.callback('🔒 Trading Controls', `launch_trading_controls_${launch.id}`)
        ]);
        buttons.push([
          Markup.button.callback('⚙️ Contract Settings', `launch_contract_settings_${launch.id}`),
          Markup.button.callback('📊 Analytics', `launch_analytics_${launch.id}`)
        ]);
        break;

      case 'failed':
        buttons.push([
          Markup.button.callback('🔄 Retry Launch', `launch_retry_${launch.id}`)
        ]);
        buttons.push([
          Markup.button.callback('💧 Manual Setup', `launch_manual_setup_${launch.id}`)
        ]);
        buttons.push([
          Markup.button.callback('⚙️ Contract Settings', `launch_contract_settings_${launch.id}`)
        ]);
        break;

      case 'cancelled':
        buttons.push([
          Markup.button.callback('🚀 New Launch', `launch_create_liquidity_${launch.id}`)
        ]);
        buttons.push([
          Markup.button.callback('⚙️ Contract Settings', `launch_contract_settings_${launch.id}`)
        ]);
        break;

      default:
        buttons.push([
          Markup.button.callback('⚙️ Contract Settings', `launch_contract_settings_${launch.id}`)
        ]);
        break;
    }

    return buttons;
  }
} 