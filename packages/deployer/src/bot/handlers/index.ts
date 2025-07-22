// src/bot/handlers/index.ts
import { Markup } from 'telegraf';
import { BotContext } from '../types';
import { BotScreens } from '../screens';
import { BotKeyboards } from '../keyboards';
import { web3Provider } from '../../web3/provider';
import { DeploymentHandler } from './deployment.handler';
import { NavigationHandler } from './navigation.handler';

export class BotHandlers {
  // Home screen handler
  static async showHome(ctx: BotContext) {
    try {
      ctx.session.currentScreen = 'home';
      
      const screen = BotScreens.getHomeScreen();
      const keyboard = BotKeyboards.getHomeKeyboard();
      
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
      console.error('Error showing home screen:', error);
      await BotHandlers.showError(ctx, 'Failed to load home screen');
    }
  }

  // Deploy screen handler
  static async showDeploy(ctx: BotContext) {
    try {
      ctx.session.currentScreen = 'deploy';
      ctx.session.deployState = { step: 'select_contract' };
      
      const screen = BotScreens.getDeployScreen();
      const keyboard = BotKeyboards.getDeployKeyboard();
      
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

  // Quick deploy handler
  static async showQuickDeploy(ctx: BotContext) {
    try {
      if (!ctx.session.deployState) {
        ctx.session.deployState = { step: 'enter_name' };
      }
      
      const screen = {
        title: "⚡ Quick Deploy",
        description: `
*Quick Deploy Mode*

This will deploy a test ERC20 token with default parameters:
• **Name:** "Test Token"
• **Symbol:** "TEST"  
• **Total Supply:** "1,000,000"
• **Decimals:** 18

Perfect for testing and demonstrations!

*What happens next:*
✅ Deploy contract to ${web3Provider.getNetworkConfig().name}
✅ Show deployment results
✅ Display contract information

Ready to deploy?`,
        footer: "Click 'Deploy Now' to start deployment 👇"
      };
      
      const keyboard = BotKeyboards.getQuickDeployKeyboard();
      const message = BotScreens.formatScreen(screen);
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error showing quick deploy:', error);
      await BotHandlers.showError(ctx, 'Failed to load quick deploy');
    }
  }

  // Handle actual deployment
  static async handleQuickDeploy(ctx: BotContext) {
    try {
      await ctx.answerCbQuery();
      
      console.log('🚀 Starting quick deployment process...');
      
      // Show deployment in progress
      const progressScreen = {
        title: "⚡ Deploying Contract...",
        description: `
*Deployment in Progress*

🔄 Creating contract transaction...
🔄 Sending to ${web3Provider.getNetworkConfig().name}...
🔄 Waiting for confirmation...

This may take a few moments. Please wait...`,
        footer: "Do not close this window ⏳"
      };

      await ctx.editMessageText(BotScreens.formatScreen(progressScreen), {
        parse_mode: 'Markdown'
      });

      // Import the ContractService
      const { ContractService } = await import('../../services/contract.service');
      const contractService = new ContractService();

      console.log('📦 ContractService initialized, starting deployment...');

      // Deploy the contract
      const deploymentResult = await contractService.deployTestContract();

      console.log('📋 Deployment result:', deploymentResult);

      if (deploymentResult.success && deploymentResult.contractAddress) {
        console.log('✅ Deployment successful, getting contract info...');
        
        // Get contract info
        const contractInfo = await contractService.getContractInfo(deploymentResult.contractAddress);
        
        console.log('📊 Contract info:', contractInfo);
        
        await BotHandlers.showDeploymentSuccess(ctx, deploymentResult, contractInfo);
      } else {
        console.log('❌ Deployment failed:', deploymentResult.error);
        await BotHandlers.showDeploymentError(ctx, deploymentResult.error || 'Unknown error');
      }

    } catch (error) {
      console.error('❌ Error during deployment:', error);
      await BotHandlers.showDeploymentError(ctx, error instanceof Error ? error.message : 'Deployment failed');
    }
  }

  // Show successful deployment
  static async showDeploymentSuccess(ctx: BotContext, deploymentResult: any, contractInfo: any) {
    try {
      const networkConfig = web3Provider.getNetworkConfig();
      
      const screen = {
        title: "✅ Deployment Successful!",
        description: `
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
• Start interacting with your token`,
        footer: "Congratulations on your successful deployment! 🎉"
      };

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
      const screen = {
        title: "❌ Deployment Failed",
        description: `
*Contract deployment was unsuccessful*

**Error Details:**
\`${errorMessage}\`

*Common Issues:*
• Insufficient balance for gas fees
• Network connectivity problems
• Invalid contract parameters
• RPC endpoint issues

*Suggestions:*
• Check your wallet balance
• Verify network connection
• Try again in a few moments`,
        footer: "Use the buttons below to continue 👇"
      };

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
      
      const keyboard = BotKeyboards.getNetworkKeyboard();
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
      const screen = BotScreens.getErrorScreen(errorMessage);
      const keyboard = BotKeyboards.getErrorKeyboard();
      
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
      
      const keyboard = BotKeyboards.getBackKeyboard('action_home');
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

  static async showDeploymentProgress(ctx: BotContext, data?: any) {
    return await DeploymentHandler.startDeployment(ctx);
  }

  static async showDeploymentResult(ctx: BotContext, data?: any) {
    // This will be handled by the deployment handler
    return;
  }

  // Navigation handlers
  static async goBack(ctx: BotContext) {
    return await NavigationHandler.goBack(ctx);
  }

  static async goHome(ctx: BotContext) {
    return await NavigationHandler.goHome(ctx);
  }
}