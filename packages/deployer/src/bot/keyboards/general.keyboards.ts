import { Markup } from 'telegraf';

export class GeneralKeyboards {
  // Home screen keyboard - full functionality
  static getHomeKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🎯 My Launches', 'action_launches')],
      [Markup.button.callback('🚀 Deploy New Token', 'action_deploy')],
      [
        Markup.button.callback('💼 Wallets', 'action_wallets'),
        Markup.button.callback('📋 Contracts', 'action_contracts')
      ],
      [
        Markup.button.callback('⚙️ Settings', 'action_settings'),
        Markup.button.callback('📊 Network', 'action_network')
      ]
    ]);
  }

  // Welcome screen keyboard for new users
  static getWelcomeKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🎯 View My Launches', 'action_launches')],
      [Markup.button.callback('🚀 Deploy First Token', 'action_deploy')],
      [
        Markup.button.callback('💼 Wallets', 'action_wallets'),
        Markup.button.callback('📋 Contracts', 'action_contracts')
      ],
      [
        Markup.button.callback('⚙️ Settings', 'action_settings'),
        Markup.button.callback('📊 Network', 'action_network')
      ],
      [Markup.button.callback('ℹ️ Learn More', 'action_help')]
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