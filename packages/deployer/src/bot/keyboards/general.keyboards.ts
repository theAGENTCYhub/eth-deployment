import { Markup } from 'telegraf';

export class GeneralKeyboards {
  // Home screen keyboard
  static getHomeKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🚀 Deploy Token', 'action_deploy'),
        Markup.button.callback('🎯 Bundle Launch', 'action_bundle_launch')
      ],
      [
        Markup.button.callback('💼 My Wallets', 'action_wallets'),
        Markup.button.callback('📋 Contracts', 'action_contracts')
      ],
      [
        Markup.button.callback('⚙️ Settings', 'action_settings'),
        Markup.button.callback('📊 Network Status', 'action_network')
      ]
    ]);
  }

  // Deploy screen keyboard
  static getDeployKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Start Deployment', 'deploy_template')],
      [Markup.button.callback('🔙 Back to Home', 'action_home')]
    ]);
  }



  // Confirmation keyboard
  static getConfirmationKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Confirm', 'confirm_yes'),
        Markup.button.callback('❌ Cancel', 'confirm_no')
      ]
    ]);
  }

  // Navigation keyboard
  static getBackKeyboard(backAction: string = 'action_home') {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Back', backAction)]
    ]);
  }

  // Network status keyboard
  static getNetworkKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Refresh Status', 'network_refresh')],
      [Markup.button.callback('💰 Check Balance', 'network_balance')],
      [Markup.button.callback('🔙 Back to Home', 'action_home')]
    ]);
  }

  // Error keyboard
  static getErrorKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Try Again', 'retry')],
      [Markup.button.callback('🏠 Home', 'action_home')]
    ]);
  }

  // Closable keyboard for simple messages
  static getClosableKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('❌ Close', 'close_message')]
    ]);
  }
} 