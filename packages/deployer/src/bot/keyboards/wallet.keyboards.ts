import { Markup } from 'telegraf';
import { CallbackManager } from '../callbacks';

export class WalletKeyboards {
  static getWalletMainKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('➕ Generate New Wallet', 'wallet_generate')],
      [Markup.button.callback('🔑 Import Wallet', 'wallet_import')],
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
} 