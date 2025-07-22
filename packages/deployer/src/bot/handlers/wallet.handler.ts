import { BotScreens } from '../screens';
import { BotKeyboards } from '../keyboards';
import { WalletService } from '@eth-deployer/supabase'
import { BotContext } from '../types';
import { Markup } from 'telegraf';

const PAGE_SIZE = 5;
const walletService = new WalletService();

export class WalletHandler {
  static async showWalletMain(ctx: BotContext) {
    const userId = String(ctx.from?.id);
    const result = await walletService.getWalletsByUser(userId);
    const walletCount = result.success && result.data ? result.data.length : 0;
    const screen = BotScreens.getWalletMainScreen(walletCount);
    const keyboard = BotKeyboards.getWalletMainKeyboard();
    try {
      await ctx.editMessageText(BotScreens.formatScreen(screen), {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
    } catch (err: any) {
      if (!(`${err}`.includes('message is not modified'))) throw err;
    }
    await ctx.answerCbQuery();
  }

  static async showWalletList(ctx: BotContext, page = 0) {
    const userId = String(ctx.from?.id);
    const result = await walletService.getWalletsByUser(userId);
    if (!result.success || !result.data) {
      await ctx.reply('Failed to load wallets.');
      return;
    }
    const wallets = result.data;
    const totalPages = Math.ceil(wallets.length / PAGE_SIZE) || 1;
    const pageWallets = wallets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    ctx.session.walletPage = page;
    const screen = BotScreens.getWalletListScreen(pageWallets, page, totalPages);
    const keyboard = BotKeyboards.getWalletListKeyboard(pageWallets, page, totalPages);
    try {
      await ctx.editMessageText(BotScreens.formatScreen(screen), {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
    } catch (err: any) {
      if (!(`${err}`.includes('message is not modified'))) throw err;
    }
    await ctx.answerCbQuery();
  }

  static async showWalletDetail(ctx: BotContext, walletId: string) {
    const userId = String(ctx.from?.id);
    const result = await walletService.getWalletsByUser(userId);
    if (!result.success || !result.data) {
      await ctx.reply('Failed to load wallet.');
      return;
    }
    const wallet = result.data.find((w: any) => w.id === walletId);
    if (!wallet) {
      await ctx.reply('Wallet not found.');
      return;
    }
    if (ctx.session.deployState) ctx.session.deployState.selectedWalletId = walletId;
    const screen = BotScreens.getWalletDetailScreen(wallet);
    const keyboard = BotKeyboards.getWalletDetailKeyboard(walletId);
    await ctx.editMessageText(BotScreens.formatScreen(screen), {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });
    await ctx.answerCbQuery();
  }

  static async generateWallet(ctx: BotContext) {
    const userId = String(ctx.from?.id);
    const name = `Wallet #${Math.floor(Math.random() * 10000)}`;
    const result = await walletService.generateWallet({ type: 'minor', userId, name });
    if (result.success && result.data) {
      await ctx.reply(`✅ New wallet generated: \`${result.data.address}\``, {
        parse_mode: 'Markdown',
        reply_markup: BotKeyboards.getClosableKeyboard().reply_markup
      });
    } else {
      await ctx.reply('Failed to generate wallet.', {
        reply_markup: BotKeyboards.getClosableKeyboard().reply_markup
      });
    }
    return WalletHandler.showWalletMain(ctx);
  }

  static async exportPrivateKey(ctx: BotContext, walletId: string) {
    const result = await walletService.exportPrivateKey(walletId);
    if (result.success && result.privateKey) {
      await ctx.reply(`🔑 Private key: \n\n\`${result.privateKey}\`\n\n*Keep this key safe!*`, {
        parse_mode: 'Markdown',
        reply_markup: BotKeyboards.getClosableKeyboard().reply_markup
      });
    } else {
      await ctx.reply('Failed to export private key.', {
        reply_markup: BotKeyboards.getClosableKeyboard().reply_markup
      });
    }
    return this.showWalletDetail(ctx, walletId);
  }

  static async removeWallet(ctx: BotContext, walletId: string) {
    // Export private key before deleting
    const result = await walletService.exportPrivateKey(walletId);
    await walletService.deleteWallet(walletId);
    if (result.success && result.privateKey) {
      await ctx.reply(`🗑 Wallet removed.\n\n🔑 Private key: \n\n\`${result.privateKey}\`\n\n*Keep this key safe!*`, {
        parse_mode: 'Markdown',
        reply_markup: BotKeyboards.getClosableKeyboard().reply_markup
      });
    } else {
      await ctx.reply('Wallet removed, but failed to export private key.', {
        reply_markup: BotKeyboards.getClosableKeyboard().reply_markup
      });
    }
    return WalletHandler.showWalletMain(ctx);
  }

  static async changeNickname(ctx: BotContext, walletId: string) {
    ctx.session.awaitingNicknameWalletId = walletId;
    await ctx.reply('Please send the new nickname for this wallet:');
  }

  static async handleNicknameInput(ctx: BotContext) {
    const walletId = ctx.session.awaitingNicknameWalletId;
    if (!walletId) return;
    const newName = (ctx.message && 'text' in ctx.message) ? ctx.message.text.trim() : undefined;
    if (!newName) {
      await ctx.reply('Invalid nickname.');
      return;
    }
    await walletService.updateWalletName(walletId, newName);
    ctx.session.awaitingNicknameWalletId = undefined;
    await ctx.reply('✅ Nickname updated!');
    const userId = String(ctx.from?.id);
    const result = await walletService.getWalletsByUser(userId);
    if (result.success && result.data) {
      const wallet = result.data.find((w: any) => w.id === walletId);
      if (wallet) {
        const screen = BotScreens.getWalletDetailScreen(wallet);
        const keyboard = BotKeyboards.getWalletDetailKeyboard(walletId);
        await ctx.reply(BotScreens.formatScreen(screen), {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
      }
    }
  }

  static async importWalletPrompt(ctx: BotContext) {
    ctx.session.awaitingImportPrivateKey = true;
    await ctx.reply('Please send the private key of the wallet you want to import:');
  }

  static async handleImportPrivateKey(ctx: BotContext) {
    const privateKey = (ctx.message && 'text' in ctx.message) ? ctx.message.text.trim() : undefined;
    if (!privateKey) {
      await ctx.reply('Invalid private key. Please try again.');
      return;
    }
    const userId = String(ctx.from?.id);
    try {
      const result = await walletService.importWallet({ privateKey, type: 'minor', userId });
      ctx.session.awaitingImportPrivateKey = undefined;
      if (result.success && result.data) {
        await ctx.reply(`✅ Wallet imported: \`${result.data.address}\``, {
          parse_mode: 'Markdown',
          reply_markup: BotKeyboards.getClosableKeyboard().reply_markup
        });
        // Show wallet main screen as a new message
        const walletsResult = await walletService.getWalletsByUser(userId);
        const walletCount = walletsResult.success && walletsResult.data ? walletsResult.data.length : 0;
        const screen = BotScreens.getWalletMainScreen(walletCount);
        const keyboard = BotKeyboards.getWalletMainKeyboard();
        await ctx.reply(BotScreens.formatScreen(screen), {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
        return;
      } else {
        await ctx.reply('Failed to import wallet. Please check your private key and try again.');
      }
    } catch (err) {
      ctx.session.awaitingImportPrivateKey = undefined;
      await ctx.reply('Failed to import wallet. Please check your private key and try again.');
    }
  }

  static async closeMessage(ctx: BotContext) {
    try {
      if (ctx.callbackQuery && 'message' in ctx.callbackQuery && ctx.callbackQuery.message) {
        await ctx.deleteMessage();
      }
    } catch (err) {
      // ignore
    }
    await ctx.answerCbQuery();
  }
}

export const WalletHandlers = {
  showWalletMain: WalletHandler.showWalletMain,
  showWalletList: WalletHandler.showWalletList,
  showWalletDetail: WalletHandler.showWalletDetail,
  generateWallet: WalletHandler.generateWallet,
  importWalletPrompt: WalletHandler.importWalletPrompt,
  handleImportPrivateKey: WalletHandler.handleImportPrivateKey,
  exportPrivateKey: WalletHandler.exportPrivateKey,
  changeNickname: WalletHandler.changeNickname,
  handleNicknameInput: WalletHandler.handleNicknameInput,
  removeWallet: WalletHandler.removeWallet,
  closeMessage: WalletHandler.closeMessage
}; 