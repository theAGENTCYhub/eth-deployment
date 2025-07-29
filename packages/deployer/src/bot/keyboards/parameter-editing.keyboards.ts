import { Markup } from 'telegraf';
import { CallbackManager } from '../callbacks';

// Utility to escape Markdown special characters
function escapeMarkdown(text: string): string {
    if (!text) return '';
    return text
        .replace(/([_\*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

const PARAMETER_CATEGORIES = {
  basic: ['TOKEN_NAME', 'TOKEN_SYMBOL', 'TOTAL_SUPPLY', 'DECIMALS'],
  taxes: ['INITIAL_BUY_TAX', 'INITIAL_SELL_TAX', 'FINAL_BUY_TAX', 'FINAL_SELL_TAX', 'TRANSFER_TAX'],
  trading: ['REDUCE_BUY_TAX_AT', 'REDUCE_SELL_TAX_AT', 'PREVENT_SWAP_BEFORE'],
  limits: ['MAX_TX_AMOUNT_PERCENT', 'MAX_WALLET_SIZE_PERCENT', 'TAX_SWAP_LIMIT_PERCENT', 'MAX_SWAP_LIMIT_PERCENT'],
  advanced: ['TAX_WALLET']
};

export class ParameterEditingKeyboards {
  /**
   * Main category menu keyboard
   */
  static categoryMenu(instanceId: string, ctx: any): any {
    const basicId = CallbackManager.generateParamEditingCallback('cat_basic', instanceId);
    const taxesId = CallbackManager.generateParamEditingCallback('cat_taxes', instanceId);
    const tradingId = CallbackManager.generateParamEditingCallback('cat_trading', instanceId);
    const limitsId = CallbackManager.generateParamEditingCallback('cat_limits', instanceId);
    const advancedId = CallbackManager.generateParamEditingCallback('cat_advanced', instanceId);
    const devWalletId = CallbackManager.generateParamEditingCallback('choose_dev_wallet', instanceId);
    const saveId = CallbackManager.generateParamEditingCallback('save_config', instanceId);
    const loadId = CallbackManager.generateParamEditingCallback('load_config', instanceId);

    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Basic Info', callback_data: basicId }, { text: '💰 Tax Settings', callback_data: taxesId }],
          [{ text: '📈 Trading Rules', callback_data: tradingId }, { text: '🚫 Limits', callback_data: limitsId }],
          [{ text: '⚙️ Advanced', callback_data: advancedId }],
          [{ text: '👤 Developer Wallet', callback_data: devWalletId }],
          [{ text: '💾 Save Config', callback_data: saveId }, { text: '📂 Load Config', callback_data: loadId }],
          [{ text: '✅ Finish Editing', callback_data: 'deploy_review' }, { text: '🔙 Back', callback_data: 'deploy_template_selected' }]
        ]
      }
    };
  }

  /**
   * Get parameters for a specific category
   */
  static getCategoryParams(category: string): string[] {
    return PARAMETER_CATEGORIES[category as keyof typeof PARAMETER_CATEGORIES] || [];
  }

  /**
   * Category-specific keyboard generator
   */
  static categoryKeyboard(parameters: any[], instanceId: string, category: string, ctx: any): any {
    const buttons = [];
    const categoryParams = parameters.filter(p => this.getCategoryParams(category).includes(p.parameter_key));
    
    for (let i = 0; i < categoryParams.length; i += 2) {
      const row = [];
      for (let j = 0; j < 2 && i + j < categoryParams.length; j++) {
        const param = categoryParams[i + j];
        const callbackId = CallbackManager.generateParamEditingCallback('edit_param', instanceId, param.parameter_key);
        const status = param.current_value ? '✅' : '⏳';
        row.push({
          text: `${status} ${this.getShortParamName(param.parameter_key)}`,
          callback_data: callbackId
        });
      }
      buttons.push(row);
    }
    
    const backId = CallbackManager.generateParamEditingCallback('back_categories', instanceId);
    buttons.push([{ text: '🔙 Back to Categories', callback_data: backId }]);
    
    return {
      reply_markup: {
        inline_keyboard: buttons
      }
    };
  }

  /**
   * Get shortened parameter names for buttons
   */
  static getShortParamName(paramKey: string): string {
    const shortNames: Record<string, string> = {
      'TOKEN_NAME': 'Name',
      'TOKEN_SYMBOL': 'Symbol',
      'TOTAL_SUPPLY': 'Supply',
      'DECIMALS': 'Decimals',
      'INITIAL_BUY_TAX': 'Initial Buy %',
      'INITIAL_SELL_TAX': 'Initial Sell %',
      'FINAL_BUY_TAX': 'Final Buy %',
      'FINAL_SELL_TAX': 'Final Sell %',
      'TRANSFER_TAX': 'Transfer %',
      'REDUCE_BUY_TAX_AT': 'Reduce Buy At',
      'REDUCE_SELL_TAX_AT': 'Reduce Sell At',
      'PREVENT_SWAP_BEFORE': 'Prevent Swap',
      'MAX_TX_AMOUNT_PERCENT': 'Max TX %',
      'MAX_WALLET_SIZE_PERCENT': 'Max Wallet %',
      'TAX_SWAP_LIMIT_PERCENT': 'Tax Swap %',
      'MAX_SWAP_LIMIT_PERCENT': 'Max Swap %',
      'TAX_WALLET': 'Tax Wallet'
    };
    return shortNames[paramKey] || paramKey.replace(/_/g, ' ');
  }

  /**
   * Generate short callback for parameter editing
   */
  static generateShortCallback(ctx: any, action: string, key: string): string {
    if (!ctx.session.paramCallbacks) {
      ctx.session.paramCallbacks = new Map();
    }
    const shortId = `p${Date.now().toString(36)}${Math.random().toString(36).substr(2, 2)}`.substr(0, 20);
    ctx.session.paramCallbacks.set(shortId, {
      action,
      key,
      type: 'parameter'
    });
    return shortId;
  }

  static devWalletSelectionKeyboard(wallets: any[], ctx: any): any {
    const rows = wallets.map((w: any, i: number) => {
      const shortId = CallbackManager.generateDevWalletCallback(w.id);
      return [{ text: `${i + 1}. ${w.name || w.address.slice(0, 8)}`, callback_data: shortId }];
    });
    rows.push([
      { text: '🔙 Back to Categories', callback_data: CallbackManager.generateParamEditingCallback('back_categories', 'dev_wallet') }
    ]);
    return {
      reply_markup: {
        inline_keyboard: rows
      }
    };
  }
} 