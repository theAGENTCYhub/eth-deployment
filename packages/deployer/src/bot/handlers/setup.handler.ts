import { Telegraf } from 'telegraf';
import { BotContext } from '../types';
import { BotHandlers } from './index';
import { DeploymentHandler } from './deployment.handler';
import { NavigationHandler } from './navigation.handler';
import { CallbackManager } from '../callbacks';
import { web3Provider } from '../../web3/provider';
import { WalletHandlers } from './wallet.handler';
import { ContractsHandler } from './contracts.handler';
import { ConfigurationsHandler } from './settings/configurations.handler';
import { BundleLaunchHandler } from './bundle/bundle-launch.handler';

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
        // Contract actions
        case 'contract_detail':
          await ContractsHandler.showContractDetails(ctx, data.contractId);
          break;
        case 'contract_remove':
          await ContractsHandler.showRemoveConfirmation(ctx, data.contractId);
          break;
        case 'contract_confirm_remove':
          await ContractsHandler.removeContract(ctx, data.contractId);
          break;
        case 'contract_copy':
          // TODO: Implement copy address functionality
          await ctx.answerCbQuery('Copy functionality coming soon!');
          break;
        case 'contracts_page':
          await ContractsHandler.showDeployedContracts(ctx, data.page);
          break;
        // Launch actions
        case 'launch_detail':
          const { LaunchesHandler } = await import('./launches/launches.handler');
          await LaunchesHandler.showLaunchDetail(ctx, data.launchId);
          break;
        case 'launch_management':
          const { LaunchesHandler: LaunchesHandler2 } = await import('./launches/launches.handler');
          await LaunchesHandler2.showLaunchManagement(ctx, data.launchId);
          break;
        case 'launch_positions':
          const { PositionsHandler } = await import('./launches/positions.handler');
          await PositionsHandler.showPositionsList(ctx, data.launchId);
          break;
        case 'launches_page':
          const { LaunchesHandler: LaunchesHandler3 } = await import('./launches/launches.handler');
          await LaunchesHandler3.handleLaunchesPagination(ctx, data.page);
          break;
        case 'position_detail':
          const { PositionDetailHandler } = await import('./launches/position-detail.handler');
          await PositionDetailHandler.showPositionDetail(ctx, data.launchId, data.walletId);
          break;
        case 'positions_page':
          const { PositionsHandler: PositionsHandler2 } = await import('./launches/positions.handler');
          await PositionsHandler2.handlePositionsPagination(ctx, data.launchId, data.page);
          break;
        case 'position_mode':
          const { PositionDetailHandler: PositionDetailHandler2 } = await import('./launches/position-detail.handler');
          await PositionDetailHandler2.switchTradingMode(ctx, data.launchId, data.walletId, data.mode);
          break;
        case 'trade':
          const { PositionDetailHandler: PositionDetailHandler3 } = await import('./launches/position-detail.handler');
          if (data.mode === 'buy') {
            await PositionDetailHandler3.initiateBuyTrade(ctx, data.launchId, data.walletId, data.amount);
          } else {
            await PositionDetailHandler3.initiateSellTrade(ctx, data.launchId, data.walletId, data.amount);
          }
          break;
        case 'trade_slippage':
          const { PositionDetailHandler: PositionDetailHandler4 } = await import('./launches/position-detail.handler');
          await PositionDetailHandler4.showSlippageConfig(ctx, data.launchId, data.walletId);
          break;
        case 'position_refresh':
          const { PositionDetailHandler: PositionDetailHandler5 } = await import('./launches/position-detail.handler');
          await PositionDetailHandler5.refreshPosition(ctx, data.launchId, data.walletId);
          break;
        case 'trade_confirm':
          const { TradingHandler } = await import('./launches/trading.handler');
          await TradingHandler.executeTrade(ctx, data.launchId, data.walletId, data.mode, data.amount);
          break;
        case 'trade_cancel':
          const { TradingHandler: TradingHandler2 } = await import('./launches/trading.handler');
          await TradingHandler2.cancelTrade(ctx, data.launchId, data.walletId);
          break;
        default:
          await ctx.answerCbQuery('❌ Unknown action');
      }
    });

    // Enhanced contract callback handlers (compressed callbacks starting with 'c')
    bot.action(/^c[a-zA-Z0-9]+$/, async (ctx) => {
      await ContractsHandler.handleEnhancedCallback(ctx);
    });

    // Contract header buttons (non-functional, just for visual organization)
    bot.action('contract_actions_header', async (ctx) => {
      await ctx.answerCbQuery('📋 Actions section');
    });
    
    bot.action('contract_operations_header', async (ctx) => {
      await ctx.answerCbQuery('⚙️ Operations section');
    });

    bot.action('action_abort_deployment', async (ctx) => {
      await DeploymentHandler.abortDeployment(ctx);
    });

    // Deployment handlers
    bot.action('start_deployment', DeploymentHandler.startDeployment);
    bot.action('retry_deployment', DeploymentHandler.startDeployment);

    // Bundle launch handlers
    bot.action('action_bundle_launch', BundleLaunchHandler.startLaunchFlow);
    bot.action('bundle_save_config', BundleLaunchHandler.saveConfig);
    bot.action('bundle_load_config', BundleLaunchHandler.loadConfig);
    bot.action('bundle_review', BundleLaunchHandler.reviewLaunch);
    bot.action('bundle_confirm_launch', BundleLaunchHandler.executeLaunch);
    bot.action('bundle_cancel', async (ctx) => await ctx.reply('❌ Bundle launch cancelled.'));
    bot.action('bundle_edit_token', async (ctx) => BundleLaunchHandler.handleEditParam(ctx, 'tokenName'));
    bot.action('bundle_edit_wallets', async (ctx) => BundleLaunchHandler.handleEditParam(ctx, 'bundle_wallet_count'));
    bot.action('bundle_edit_totalpct', async (ctx) => BundleLaunchHandler.handleEditParam(ctx, 'bundle_token_percent'));
    bot.action('bundle_edit_split', async (ctx) => BundleLaunchHandler.handleEditParam(ctx, 'split'));
    bot.action('bundle_edit_liquidityeth', async (ctx) => BundleLaunchHandler.handleEditParam(ctx, 'liquidity_eth_amount'));
    bot.action('bundle_edit_clog', async (ctx) => BundleLaunchHandler.handleEditParam(ctx, 'clog_percent'));
    bot.action('bundle_edit_fundingwallet', async (ctx) => BundleLaunchHandler.handleEditParam(ctx, 'fundingWalletName'));
    bot.action('bundle_edit_devwallet', async (ctx) => BundleLaunchHandler.handleEditParam(ctx, 'devWalletName'));
    bot.action(/^bundle_select_token_(\d+)$/, async (ctx) => {
      const idx = ctx.match[1];
      await BundleLaunchHandler.handleSelectToken(ctx, idx);
    });
    bot.action(/^bundle_select_wallet_devWallet_(.+)$/, async (ctx) => {
      const walletId = ctx.match[1];
      await BundleLaunchHandler.handleSelectWallet(ctx, 'devWallet', walletId);
    });
    bot.action(/^bundle_select_wallet_fundingWallet_(.+)$/, async (ctx) => {
      const walletId = ctx.match[1];
      await BundleLaunchHandler.handleSelectWallet(ctx, 'fundingWallet', walletId);
    });

    // Coming soon handlers
    bot.action('action_wallets', WalletHandlers.showWalletMain);
    bot.action('action_contracts', ContractsHandler.showContractsMain);
    bot.action('action_settings', async (ctx) => {
      const { SettingsHandler } = await import('./settings/settings.handler');
      await SettingsHandler.showSettings(ctx);
    });
    bot.action('action_launches', async (ctx) => {
      const { LaunchesHandler } = await import('./launches/launches.handler');
      await LaunchesHandler.showLaunchesList(ctx);
    });

    // Contracts handlers
    bot.action('contracts_view_deployed', async (ctx) => {
      await ContractsHandler.showDeployedContracts(ctx, 0);
    });

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



    // Slippage setting handlers
    bot.action(/^slippage_set_(.+)_(.+)_(.+)$/, async (ctx) => {
      const launchId = ctx.match[1];
      const walletId = ctx.match[2];
      const slippage = ctx.match[3];
      const { TradingHandler } = await import('./launches/trading.handler');
      await TradingHandler.setSlippage(ctx, launchId, walletId, slippage);
    });
    // Handle text input for bundle parameter editing and config editing
    bot.on('text', async (ctx, next) => {
      if (ctx.session?.awaitingBundleParam) {
        await BundleLaunchHandler.handleParamInput(ctx);
        return;
      }
      if (ctx.session?.awaitingConfigParam) {
        // Handle config parameter input
        const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
        const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
        const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
        
        if (ctx.session.deploymentConfigEdit) {
          await DeploymentConfigsHandler.handleParamInput(ctx);
        } else if (ctx.session.liquidityConfigEdit) {
          await LiquidityConfigsHandler.handleParamInput(ctx);
        } else if (ctx.session.bundleConfigEdit) {
          await BundleConfigsHandler.handleParamInput(ctx);
        }
        return;
      }
      if (next) await next();
    });

    // Settings and Configuration Management Handlers
    bot.action('settings_deployment_configs', async (ctx) => {
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.listConfigs(ctx);
    });
    
    bot.action('settings_liquidity_configs', async (ctx) => {
      const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
      await LiquidityConfigsHandler.listConfigs(ctx);
    });
    
    bot.action('settings_bundle_configs', async (ctx) => {
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.listConfigs(ctx);
    });

    // Deployment Configs Actions
    bot.action('dep_cfg_new', async (ctx) => {
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.createConfig(ctx);
    });
    
    bot.action(/^dep_cfg_view_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.viewConfig(ctx, configId);
    });
    
    bot.action(/^dep_cfg_edit_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.editConfig(ctx, configId);
    });
    
    bot.action(/^dep_cfg_delete_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.deleteConfig(ctx, configId);
    });
    
    bot.action('dep_cfg_list', async (ctx) => {
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.listConfigs(ctx);
    });
    
    bot.action(/^dep_cfg_name_(.+)$/, async (ctx) => {
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.handleEditParam(ctx, 'name');
    });
    
    bot.action(/^dep_cfg_cat_(.+)_(.+)$/, async (ctx) => {
      const category = ctx.match[1];
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.showCategoryParameters(ctx, category);
    });
    
    bot.action(/^dep_cfg_param_(.+)_(.+)$/, async (ctx) => {
      const paramKey = ctx.match[1];
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.handleEditParam(ctx, paramKey);
    });
    
    bot.action(/^dep_cfg_categories_(.+)$/, async (ctx) => {
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.showParameterCategories(ctx);
    });
    
    bot.action(/^dep_cfg_save_(.+)$/, async (ctx) => {
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.saveConfig(ctx);
    });
    
    bot.action(/^dep_cfg_cancel_(.+)$/, async (ctx) => {
      const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
      await DeploymentConfigsHandler.cancelEdit(ctx);
    });

    // Liquidity Configs Actions
    bot.action('liq_cfg_new', async (ctx) => {
      const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
      await LiquidityConfigsHandler.createConfig(ctx);
    });
    
    bot.action(/^liq_cfg_view_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
      await LiquidityConfigsHandler.viewConfig(ctx, configId);
    });
    
    bot.action(/^liq_cfg_edit_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
      await LiquidityConfigsHandler.editConfig(ctx, configId);
    });
    
    bot.action(/^liq_cfg_delete_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
      await LiquidityConfigsHandler.deleteConfig(ctx, configId);
    });
    
    bot.action('liq_cfg_list', async (ctx) => {
      const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
      await LiquidityConfigsHandler.listConfigs(ctx);
    });
    
    bot.action(/^liq_cfg_name_(.+)$/, async (ctx) => {
      const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
      await LiquidityConfigsHandler.handleEditParam(ctx, 'name');
    });
    
    bot.action(/^liq_cfg_eth_(.+)$/, async (ctx) => {
      const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
      await LiquidityConfigsHandler.handleEditParam(ctx, 'initial_liquidity_eth');
    });
    
    bot.action(/^liq_cfg_wallet_(.+)$/, async (ctx) => {
      const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
      await LiquidityConfigsHandler.handleEditParam(ctx, 'liquidity_wallet_id');
    });
    
    bot.action(/^liq_cfg_save_(.+)$/, async (ctx) => {
      const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
      await LiquidityConfigsHandler.saveConfig(ctx);
    });
    
    bot.action(/^liq_cfg_cancel_(.+)$/, async (ctx) => {
      const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
      await LiquidityConfigsHandler.cancelEdit(ctx);
    });

    // Bundle Configs Actions
    bot.action('bundle_cfg_new', async (ctx) => {
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.createConfig(ctx);
    });
    
    bot.action(/^bundle_cfg_view_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.viewConfig(ctx, configId);
    });
    
    bot.action(/^bundle_cfg_edit_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.editConfig(ctx, configId);
    });
    
    bot.action(/^bundle_cfg_delete_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.deleteConfig(ctx, configId);
    });
    
    bot.action('bundle_cfg_list', async (ctx) => {
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.listConfigs(ctx);
    });
    
    bot.action(/^bundle_cfg_name_(.+)$/, async (ctx) => {
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.handleEditParam(ctx, 'name');
    });
    
    bot.action(/^bundle_cfg_type_(.+)$/, async (ctx) => {
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.handleEditParam(ctx, 'bundle_type');
    });
    
    bot.action(/^bundle_cfg_wallets_(.+)$/, async (ctx) => {
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.handleEditParam(ctx, 'bundle_wallet_count');
    });
    
    bot.action(/^bundle_cfg_supply_(.+)$/, async (ctx) => {
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.handleEditParam(ctx, 'total_supply_percentage');
    });
    
    bot.action(/^bundle_cfg_funding_(.+)$/, async (ctx) => {
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.showWalletSelection(ctx);
    });
    
    bot.action(/^bundle_cfg_save_(.+)$/, async (ctx) => {
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.saveConfig(ctx);
    });
    
    bot.action(/^bundle_cfg_cancel_(.+)$/, async (ctx) => {
      const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
      await BundleConfigsHandler.cancelEdit(ctx);
    });

    // Parameter editing category navigation and config save/load
    bot.action(/^p[a-zA-Z0-9]+$/, async (ctx) => {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
      const shortId = ctx.callbackQuery.data as string;
      const resolvedCallback = CallbackManager.resolveParamEditingCallback(shortId);
      if (!resolvedCallback) {
        await ctx.answerCbQuery('❌ Invalid action.');
        return;
      }
      const { action, data } = resolvedCallback;
      switch (action) {
        case 'cat_basic':
          await DeploymentHandler.handleCategoryNavigation(ctx, 'basic');
          break;
        case 'cat_taxes':
          await DeploymentHandler.handleCategoryNavigation(ctx, 'taxes');
          break;
        case 'cat_trading':
          await DeploymentHandler.handleCategoryNavigation(ctx, 'trading');
          break;
        case 'cat_limits':
          await DeploymentHandler.handleCategoryNavigation(ctx, 'limits');
          break;
        case 'cat_advanced':
          await DeploymentHandler.handleCategoryNavigation(ctx, 'advanced');
          break;
        case 'back_categories':
          await DeploymentHandler.showParameterCategories(ctx);
          break;
        case 'save_config':
          await DeploymentHandler.handleSaveConfiguration(ctx);
          break;
        case 'load_config':
          await DeploymentHandler.handleLoadConfiguration(ctx);
          break;
        case 'choose_dev_wallet':
          await DeploymentHandler.handleDeveloperWalletSelection(ctx);
          break;
        case 'edit_param':
          if (ctx.session.deployState?.templateId && data.key) {
            await DeploymentHandler.showSingleParameterEditing(ctx, ctx.session.deployState.templateId, data.key);
          }
          break;
        default:
          await ctx.answerCbQuery('❌ Unknown action.');
      }
    });
    // Handle finish editing
    bot.action('deploy_review', async (ctx) => {
      await DeploymentHandler.handleFinishEditing(ctx);
    });
    // Handle developer wallet selection
    bot.action(/^select_dev_wallet_(.+)$/, async (ctx) => {
      const walletId = ctx.match[1];
      await DeploymentHandler.handleDeveloperWalletSelected(ctx, walletId);
    });
    // Load config selection
    bot.action(/^load_config_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      await DeploymentHandler.handleLoadConfigurationSelection(ctx, configId);
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
    bot.on('text', async (ctx, next) => {
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
        // Check if awaiting contract name input
        if (ctx.session.awaitingInput === 'contract_name') {
          await ContractsHandler.handleNameInput(ctx);
          return;
        }
        // Check if awaiting config name input
        if (ctx.session.awaitingInput === 'config_name') {
          await DeploymentHandler.handleConfigurationNameInput(ctx);
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

    // Settings handlers
    bot.action('action_settings', ConfigurationsHandler.listConfigs);
    bot.action(/^config_view_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      await ConfigurationsHandler.viewConfig(ctx, configId);
    });
    bot.action('config_create', ConfigurationsHandler.createConfig);
    bot.action(/^config_edit_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      await ConfigurationsHandler.editConfig(ctx, configId);
    });
    bot.action(/^config_delete_(.+)$/, async (ctx) => {
      const configId = ctx.match[1];
      await ConfigurationsHandler.deleteConfig(ctx, configId);
    });
    // Multi-parameter editing actions
    bot.action(/^config_edit_param_([a-zA-Z0-9_]+)_(.+)$/, async (ctx) => {
      const param = ctx.match[1];
      await ConfigurationsHandler.handleEditParam(ctx, param);
    });
    bot.action(/^config_save_(.+)$/, async (ctx) => {
      const isNew = ctx.match[1] === 'new';
      await ConfigurationsHandler.saveConfig(ctx, isNew);
    });
    bot.action(/^config_cancel_(.+)$/, async (ctx) => {
      await ConfigurationsHandler.listConfigs(ctx);
    });
    // Handle text input for parameter editing
    bot.on('text', async (ctx, next) => {
      if (ctx.session?.awaitingConfigParam) {
        // Route to the correct config handler based on which config is being edited
        if (ctx.session.deploymentConfigEdit) {
          const { DeploymentConfigsHandler } = await import('./settings/deployment-configs.handler');
          await DeploymentConfigsHandler.handleParamInput(ctx);
        } else if (ctx.session.liquidityConfigEdit) {
          const { LiquidityConfigsHandler } = await import('./settings/liquidity-configs.handler');
          await LiquidityConfigsHandler.handleParamInput(ctx);
        } else if (ctx.session.bundleConfigEdit) {
          const { BundleConfigsHandler } = await import('./settings/bundle-configs.handler');
          await BundleConfigsHandler.handleParamInput(ctx);
        } else {
          // Fallback to old handler if no specific config is being edited
          await ConfigurationsHandler.handleParamInput(ctx);
        }
        return;
      }
      if (next) await next();
    });

    // Handle developer wallet selection callbacks
    bot.action(/^w[a-zA-Z0-9]+$/, async (ctx) => {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
      const shortId = ctx.callbackQuery.data as string;
      const resolvedCallback = CallbackManager.resolveParamEditingCallback(shortId);
      if (!resolvedCallback || resolvedCallback.action !== 'select_dev_wallet') {
        await ctx.answerCbQuery('❌ Invalid wallet selection.');
        return;
      }
      const walletId = resolvedCallback.data.walletId;
      if (walletId) {
        await DeploymentHandler.handleDeveloperWalletSelected(ctx, walletId);
      }
    });

    // Delete message handler
    bot.action('delete_msg', async (ctx) => {
      try {
        if (ctx.callbackQuery?.message) {
          await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
        }
        await ctx.answerCbQuery();
      } catch (error) {
        console.error('Error deleting message:', error);
        await ctx.answerCbQuery('❌ Failed to delete message');
      }
    });
  }
} 