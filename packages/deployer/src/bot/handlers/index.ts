// src/bot/handlers/index.ts
import { Markup } from 'telegraf';
import { BotContext } from '../types';
import { BotScreens, GeneralScreens } from '../screens';
import { BotKeyboards, GeneralKeyboards } from '../keyboards';
import { web3Provider } from '../../web3/provider';
import { DeploymentHandler } from './deployment.handler';
import { NavigationHandler } from './navigation.handler';
import { WalletHandler } from './wallet.handler';
import { ContractsHandler } from './contracts.handler';

export class BotHandlers {
  // Home screen handler
  static async showHome(ctx: BotContext) {
    try {
      ctx.session.currentScreen = 'home';
      
      // Determine if user is new or returning
      const userName = ctx.from?.first_name;
      const hasLaunches = await BotHandlers.checkUserHasLaunches(ctx);
      
      const screen = hasLaunches 
        ? GeneralScreens.getHomeScreen(userName)
        : GeneralScreens.getWelcomeScreen();
        
      const keyboard = hasLaunches
        ? GeneralKeyboards.getHomeKeyboard()
        : GeneralKeyboards.getWelcomeKeyboard();
      
      const message = BotScreens.formatScreen(screen);
      
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
      }

      // Update session
      delete ctx.session.deployState;
      delete ctx.session.launchState;

    } catch (error) {
      console.error('Error showing home screen:', error);
      await BotHandlers.showError(ctx, 'Failed to load home screen');
    }
  }

  /**
   * Check if user has any launches
   */
  private static async checkUserHasLaunches(ctx: BotContext): Promise<boolean> {
    try {
      if (!ctx.from) return false;
      
      const { TokenLaunchesService } = await import('@eth-deployer/supabase');
      const launchesService = new TokenLaunchesService();
      const result = await launchesService.getUserLaunches(ctx.from.id.toString());
      
      return !!(result.success && result.data && result.data.length > 0);
    } catch (error) {
      console.error('Error checking user launches:', error);
      return false;
    }
  }

  // Deploy screen handler
  static async showDeploy(ctx: BotContext) {
    try {
      ctx.session.currentScreen = 'deploy';
      ctx.session.deployState = { step: 'select_contract' };
      
      const screen = GeneralScreens.getDeployScreen();
      const keyboard = GeneralKeyboards.getDeployKeyboard();
      
      const message = BotScreens.formatScreen(screen);
      
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
      }
    } catch (error) {
      console.error('Error showing deploy screen:', error);
      await BotHandlers.showError(ctx, 'Failed to load deploy screen');
    }
  }



  // Show successful deployment
  static async showDeploymentSuccess(ctx: BotContext, deploymentResult: any, contractInfo: any) {
    try {
      const networkConfig = web3Provider.getNetworkConfig();
      
      const title = "✅ Deployment Successful!";
      const message = `
*Your token has been deployed successfully!*

🏷️ **Contract Address:** 
\`${deploymentResult.contractAddress}\`

📊 **Deployment Details:**
• **Transaction:** \`${deploymentResult.transactionHash}\`
• **Gas Used:** ${deploymentResult.gasUsed}
• **Cost:** ${deploymentResult.deploymentCost} ETH
• **Network:** ${networkConfig.name}

${contractInfo ? `
📋 **Token Information:**
• **Name:** ${contractInfo.name}
• **Symbol:** ${contractInfo.symbol}
• **Decimals:** ${contractInfo.decimals}
• **Total Supply:** ${contractInfo.totalSupply}
• **Your Balance:** ${contractInfo.deployerBalance}
` : ''}

*Next Steps:*
• Save the contract address
• Verify on block explorer
• Start interacting with your token`;
      
      const screen = GeneralScreens.getSuccessScreen(title, message);

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🚀 Deploy Another', 'deploy_quick')],
        [Markup.button.callback('🏠 Home', 'action_home')]
      ]);

      await ctx.editMessageText(BotScreens.formatScreen(screen), {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });

    } catch (error) {
      console.error('Error showing deployment success:', error);
      await BotHandlers.showError(ctx, 'Failed to display deployment results');
    }
  }

  // Show deployment error
  static async showDeploymentError(ctx: BotContext, errorMessage: string) {
    try {
      const screen = GeneralScreens.getErrorScreen(errorMessage);

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', 'deploy_quick')],
        [Markup.button.callback('📊 Check Network', 'action_network')],
        [Markup.button.callback('🏠 Home', 'action_home')]
      ]);

      await ctx.editMessageText(BotScreens.formatScreen(screen), {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });

    } catch (error) {
      console.error('Error showing deployment error:', error);
      await BotHandlers.showError(ctx, 'Failed to display error information');
    }
  }

  // Network status handler
  static async showNetworkStatus(ctx: BotContext) {
    try {
      const networkConfig = web3Provider.getNetworkConfig();
      const balance = await web3Provider.getBalance();
      const blockNumber = await web3Provider.getCurrentBlock();
      
      const screen = {
        title: "📊 Network Status",
        description: `
*Current Network Configuration*

🌐 **Network:** ${networkConfig.name}
🔗 **Chain ID:** ${networkConfig.chainId}
🔧 **RPC URL:** ${networkConfig.rpcUrl}
${networkConfig.isTestnet ? '🧪 **Type:** Testnet' : '🔴 **Type:** Mainnet'}

*Deployer Wallet Status*
💰 **Balance:** ${balance} ETH
📦 **Current Block:** ${blockNumber}
🏠 **Address:** \`${web3Provider.getWallet().address}\`

*Connection Status*
✅ Connected and ready for deployments`,
        footer: "Network information updated in real-time"
      };
      
      const keyboard = GeneralKeyboards.getNetworkKeyboard();
      const message = BotScreens.formatScreen(screen);
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error showing network status:', error);
      await BotHandlers.showError(ctx, 'Failed to load network status');
    }
  }

  // Error handler
  static async showError(ctx: BotContext, errorMessage: string) {
    try {
      const screen = GeneralScreens.getErrorScreen(errorMessage);
      const keyboard = GeneralKeyboards.getErrorKeyboard();
      
      const message = BotScreens.formatScreen(screen);
      
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
      }
    } catch (error) {
      console.error('Error showing error screen:', error);
      // Fallback to simple text message
      await ctx.reply(`Error: ${errorMessage}\n\nUse /start to return to home.`);
    }
  }

  // Coming soon handler for unimplemented features
  static async showComingSoon(ctx: BotContext, feature: string) {
    try {
      const screen = {
        title: "🚧 Coming Soon",
        description: `
*${feature}*

This feature is currently under development and will be available soon!

Stay tuned for updates.`,
        footer: "Use the back button to return 👇"
      };
      
      const keyboard = GeneralKeyboards.getBackKeyboard('action_home');
      const message = BotScreens.formatScreen(screen);
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error showing coming soon:', error);
      await BotHandlers.showError(ctx, 'Failed to load feature');
    }
  }

  // New deployment flow handlers
  static async showTemplateSelection(ctx: BotContext) {
    return await DeploymentHandler.showTemplateSelection(ctx);
  }

  static async showParameterEditing(ctx: BotContext, templateId?: string) {
    if (!templateId) {
      await ctx.reply('❌ No template selected. Please choose a template first.');
      return;
    }
    return await DeploymentHandler.showParameterEditing(ctx, templateId);
  }

  static async showDeploymentConfirmation(ctx: BotContext, data?: any) {
    return await DeploymentHandler.showParameterConfirmation(ctx);
  }





  // Navigation handlers
  static async goBack(ctx: BotContext) {
    return await NavigationHandler.goBack(ctx);
  }

  static async goHome(ctx: BotContext) {
    return await NavigationHandler.goHome(ctx);
  }
}