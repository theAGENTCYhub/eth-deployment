// src/bot/keyboards/index.ts
import { Markup } from 'telegraf';
import { CallbackManager } from '../callbacks';
// Utility to escape Markdown special characters
function escapeMarkdown(text: string): string {
    if (!text) return '';
    return text
        .replace(/([_\*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export class BotKeyboards {
  // Home screen keyboard
  static getHomeKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Deploy Token', 'action_deploy')],
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
      [Markup.button.callback('⚡ Quick Deploy', 'deploy_quick')],
      [Markup.button.callback('🔧 Advanced Deploy', 'deploy_advanced')],
      [Markup.button.callback('📋 Select Template', 'deploy_template')],
      [Markup.button.callback('🔙 Back to Home', 'action_home')]
    ]);
  }

  // Quick deploy flow keyboard
  static getQuickDeployKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Deploy Now', 'quick_deploy_start')],
      [Markup.button.callback('🔙 Back to Deploy', 'action_deploy')]
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

  // Template selection keyboard
  static getTemplateSelectionKeyboard(templates: any[]) {
    const buttons = templates.map((template, index) => 
      [Markup.button.callback(`${index + 1}. ${template.name}`, CallbackManager.generateTemplateCallback(template.id))]
    );
    
    buttons.push([Markup.button.callback('🔙 Back to Deploy', 'action_deploy')]);
    
    return Markup.inlineKeyboard(buttons);
  }

  // Parameter editing keyboard - shows all parameters as buttons
  static getParameterEditingKeyboard(templateId: string, parameters: string[], currentValues: Record<string, string> = {}) {
    const buttons = parameters.map((param) => {
      const value = currentValues[param];
      const displayValue = value ? `: ${escapeMarkdown(value)}` : '';
      return [Markup.button.callback(`⚙️ ${escapeMarkdown(param)}${displayValue}`, CallbackManager.generateParamCallback(templateId, param))];
    });
    
    // Add navigation buttons
    buttons.push([
      Markup.button.callback('✅ Confirm All', CallbackManager.generateConfirmCallback(templateId)),
      Markup.button.callback('🔄 Reset All', CallbackManager.generateResetCallback(templateId))
    ]);
    buttons.push([
      Markup.button.callback('🔙 Back to Templates', 'action_template_selection'),
      Markup.button.callback('❌ Abort', 'action_abort_deployment')
    ]);
    
    return Markup.inlineKeyboard(buttons);
  }

  // Single parameter editing keyboard
  static getSingleParameterKeyboard(templateId: string, parameter: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Back to Parameters', CallbackManager.generateBackToParamsCallback(templateId))],
      [Markup.button.callback('❌ Abort', 'action_abort_deployment')]
    ]);
  }

  // Deployment confirmation keyboard
  static getDeploymentConfirmationKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Deploy Contract', 'start_deployment')],
      [Markup.button.callback('🔙 Back to Parameters', 'action_parameter_editing')],
      [Markup.button.callback('🏠 Home', 'action_home')]
    ]);
  }

  // Deployment success keyboard
  static getDeploymentSuccessKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('📋 View Contract', 'view_contract')],
      [Markup.button.callback('🚀 Deploy Another', 'action_deploy')],
      [Markup.button.callback('🏠 Home', 'action_home')]
    ]);
  }

  // Deployment error keyboard
  static getDeploymentErrorKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Try Again', 'retry_deployment')],
      [Markup.button.callback('🔙 Back to Parameters', 'action_parameter_editing')],
      [Markup.button.callback('🏠 Home', 'action_home')]
    ]);
  }

  static getWalletMainKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('➕ Generate New Wallet', 'wallet_generate')],
      [Markup.button.callback('📒 Manage Existing Wallets', 'wallet_manage')],
      [Markup.button.callback('🔄 Refresh', 'wallets_refresh')],
      [Markup.button.callback('🔙 Back', 'action_home')]
    ]);
  }

  static getWalletListKeyboard(wallets: any[], page: number, totalPages: number) {
    const buttons = wallets.map((w, i) => [Markup.button.callback(`${i + 1}. ${w.name || w.address.slice(0, 8)}`, CallbackManager.generateCallbackId('wallet_view', { walletId: w.id }))]);
    const navButtons = [];
    if (page > 0) navButtons.push(Markup.button.callback('⬅️ Prev', 'wallet_prev'));
    if (page < totalPages - 1) navButtons.push(Markup.button.callback('Next ➡️', 'wallet_next'));
    buttons.push(navButtons);
    buttons.push([Markup.button.callback('🔄 Refresh', 'wallets_refresh')]);
    buttons.push([Markup.button.callback('🔙 Back', 'wallet_back')]);
    return Markup.inlineKeyboard(buttons);
  }

  static getWalletDetailKeyboard(walletId: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔑 Export Private Key', CallbackManager.generateCallbackId('wallet_export', { walletId }))],
      [Markup.button.callback('✏️ Change Nickname', CallbackManager.generateCallbackId('wallet_nickname', { walletId }))],
      [Markup.button.callback('🗑 Remove Wallet', CallbackManager.generateCallbackId('wallet_remove', { walletId }))],
      [Markup.button.callback('🔙 Back', 'wallet_manage')]
    ]);
  }

  static getClosableKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('❌ Close', 'close_message')]
    ]);
  }
}