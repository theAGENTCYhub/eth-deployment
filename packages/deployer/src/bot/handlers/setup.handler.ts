import { Telegraf } from 'telegraf';
import { BotContext } from '../types';
import { BotHandlers } from './index';
import { DeploymentHandler } from './deployment.handler';
import { NavigationHandler } from './navigation.handler';
import { CallbackManager } from '../callbacks';
import { web3Provider } from '../../web3/provider';
import { WalletHandlers } from './wallet.handler';

export class SetupHandler {
  /**
   * Setup all bot handlers and callbacks
   */
  static setupHandlers(bot: Telegraf<BotContext>) {
    // Command handlers
    bot.start(BotHandlers.showHome);
    bot.command('home', BotHandlers.showHome);
    bot.command('deploy', BotHandlers.showTemplateSelection);
    bot.help((ctx) => {
      ctx.reply(`
*ETH Token Deployer Bot Commands*

/start - Show home screen
/home - Return to home
/deploy - Start token deployment
/help - Show this help message

*About*
This bot helps you deploy ERC20 tokens on Ethereum. Choose your network environment and start deploying!

Current network: ${process.env.NETWORK || 'Local'}
      `, { parse_mode: 'Markdown' });
    });

    // Navigation handlers
    bot.action('action_home', BotHandlers.showHome);
    bot.action('action_deploy', BotHandlers.showTemplateSelection);
    bot.action('action_back', NavigationHandler.goBack);
    bot.action('action_go_home', NavigationHandler.goHome);

    // Deploy flow handlers
    bot.action('deploy_quick', BotHandlers.showQuickDeploy);
    bot.action('deploy_advanced', (ctx) => BotHandlers.showComingSoon(ctx, 'Advanced Deploy'));
    bot.action('deploy_template', BotHandlers.showTemplateSelection);

    // Template selection handlers
    bot.action(/^select_template_(.+)$/, async (ctx) => {
      const templateId = ctx.match[1];
      await BotHandlers.showParameterEditing(ctx, templateId);
    });

    // Parameter editing handlers
    bot.action('action_template_selection', BotHandlers.showTemplateSelection);
    bot.action('action_parameter_editing', async (ctx) => {
      const templateId = ctx.session.deployState?.templateId;
      if (templateId) {
        await BotHandlers.showParameterEditing(ctx, templateId);
      } else {
        await BotHandlers.showTemplateSelection(ctx);
      }
    });

    // Callback manager handlers for short callback IDs
    bot.action(/^cb_(\d+)$/, async (ctx) => {
      const callbackId = ctx.match[0];
      const callbackData = CallbackManager.getCallbackData(callbackId);
      
      if (!callbackData) {
        await ctx.answerCbQuery('❌ Invalid callback');
        return;
      }

      const { action, data } = callbackData;
      switch (action) {
        case 'edit_param':
          await DeploymentHandler.showSingleParameterEditing(ctx, data.templateId, data.parameter);
          break;
        case 'confirm_params':
          await DeploymentHandler.showParameterConfirmation(ctx);
          break;
        case 'reset_params':
          await DeploymentHandler.resetAllParameters(ctx);
          break;
        case 'back_to_params':
          await BotHandlers.showParameterEditing(ctx, data.templateId);
          break;
        case 'select_template':
          await BotHandlers.showParameterEditing(ctx, data.templateId);
          break;
        // Wallet actions
        case 'wallet_view':
          await WalletHandlers.showWalletDetail(ctx, data.walletId);
          break;
        case 'wallet_export':
          await WalletHandlers.exportPrivateKey(ctx, data.walletId);
          break;
        case 'wallet_nickname':
          await WalletHandlers.changeNickname(ctx, data.walletId);
          break;
        case 'wallet_remove':
          await WalletHandlers.removeWallet(ctx, data.walletId);
          break;
        default:
          await ctx.answerCbQuery('❌ Unknown action');
      }
    });

    bot.action('action_abort_deployment', async (ctx) => {
      await DeploymentHandler.abortDeployment(ctx);
    });

    // Deployment handlers
    bot.action('start_deployment', BotHandlers.showDeploymentProgress);
    bot.action('retry_deployment', BotHandlers.showDeploymentProgress);

    // Coming soon handlers
    bot.action('action_wallets', WalletHandlers.showWalletMain);
    bot.action('action_contracts', (ctx) => BotHandlers.showComingSoon(ctx, 'Contract Templates'));
    bot.action('action_settings', (ctx) => BotHandlers.showComingSoon(ctx, 'Settings'));

    // Network handlers
    bot.action('action_network', BotHandlers.showNetworkStatus);
    bot.action('network_refresh', BotHandlers.showNetworkStatus);
    bot.action('network_balance', async (ctx) => {
      try {
        const balance = await web3Provider.getBalance();
        await ctx.answerCbQuery(`Current balance: ${balance} ETH`);
      } catch (error) {
        await ctx.answerCbQuery('Failed to get balance');
      }
    });

    // Quick deploy start (legacy)
    bot.action('quick_deploy_start', BotHandlers.handleQuickDeploy);

    // Wallet management handlers
    bot.action('wallet_generate', WalletHandlers.generateWallet);
    bot.action('wallet_manage', (ctx) => WalletHandlers.showWalletList(ctx, ctx.session.walletPage || 0));
    bot.action('wallet_prev', (ctx) => WalletHandlers.showWalletList(ctx, Math.max((ctx.session.walletPage || 0) - 1, 0)));
    bot.action('wallet_next', (ctx) => WalletHandlers.showWalletList(ctx, (ctx.session.walletPage || 0) + 1));
    bot.action('wallet_back', WalletHandlers.showWalletMain);
    bot.action('wallets_refresh', WalletHandlers.showWalletMain);
    bot.action('close_message', WalletHandlers.closeMessage);
    bot.action('wallet_import', WalletHandlers.importWalletPrompt);

    // Wallet selection in deploy flow
    bot.action('choose_wallet', DeploymentHandler.handleChooseWallet);
    bot.action(/^select_wallet_(.+)$/, async (ctx) => {
      const walletId = ctx.match[1];
      await DeploymentHandler.handleWalletSelection(ctx, walletId);
    });

    // Error handlers
    bot.action('retry', (ctx) => {
      // Retry based on current screen
      const currentScreen = ctx.session.currentScreen;
      switch (currentScreen) {
        case 'deploy':
          return BotHandlers.showTemplateSelection(ctx);
        case 'template_selection':
          return BotHandlers.showTemplateSelection(ctx);
        case 'parameter_editing':
          const templateId = ctx.session.deployState?.templateId;
          return templateId ? BotHandlers.showParameterEditing(ctx, templateId) : BotHandlers.showTemplateSelection(ctx);
        case 'home':
        default:
          return BotHandlers.showHome(ctx);
      }
    });

    // Text message handler for parameter input
    bot.on('text', async (ctx) => {
      try {
        // Check if we're in single parameter editing mode
        if (ctx.session.deployState?.step === 'editing_single_parameter') {
          await DeploymentHandler.handleSingleParameterInput(ctx);
          return;
        }
        // Check if awaiting wallet nickname input
        if (ctx.session.awaitingNicknameWalletId) {
          await WalletHandlers.handleNicknameInput(ctx);
          return;
        }
        // Check if awaiting wallet import
        if (ctx.session.awaitingImportPrivateKey) {
          await WalletHandlers.handleImportPrivateKey(ctx);
          return;
        }
        // Default text handler
        await ctx.reply(
          "I don't understand that command. Use /help to see available commands or click /start to return to the home screen.",
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Error handling text message:', error);
        await ctx.reply('❌ An error occurred. Please try again.');
      }
    });
  }
} 