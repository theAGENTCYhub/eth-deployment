import { BotContext } from '../types';
import { BotScreens } from '../screens';
import { BotKeyboards } from '../keyboards';
import { DeployedContractsService } from '@eth-deployer/supabase';

export class ContractsHandler {
  private static deployedContractsService = new DeployedContractsService();

  /**
   * Show contracts main page
   */
  static async showContractsMain(ctx: BotContext) {
    try {
      const screen = {
        title: "📋 My Deployed Contracts",
        description: `
*Deployed Contract Management*

View and manage your deployed ERC20 tokens.

*Features:*
• View all deployed contracts
• See contract details and status
• Access block explorer links
• Remove contracts from list

Your deployed contracts are listed below.`,
        footer: "Select a contract to view details 👇"
      };

      const keyboard = BotKeyboards.getContractsMainKeyboard();
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
      ctx.session.currentScreen = 'contracts_main';

    } catch (error) {
      console.error('Error showing contracts main:', error);
      await ctx.reply('❌ Failed to load contracts page. Please try again.');
    }
  }

  /**
   * Show deployed contracts list with pagination
   */
  static async showDeployedContracts(ctx: BotContext, page: number = 0) {
    try {
      const contractsResult = await this.deployedContractsService.getDeployedContracts(page, 5);
      
      if (!contractsResult.success || !contractsResult.data) {
        const screen = {
          title: "📋 My Deployed Contracts",
          description: `
*No Contracts Deployed*

You haven't deployed any contracts yet.

Start by deploying your first ERC20 token!`,
          footer: "Use the back button to return 👇"
        };

        const keyboard = BotKeyboards.getContractsBackKeyboard();
        const message = BotScreens.formatScreen(screen);

        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
        await ctx.answerCbQuery();
        return;
      }

      const contracts = contractsResult.data;
      const total = contractsResult.total || 0;
      const hasMore = contractsResult.hasMore || false;

      const contractList = contracts.map((contract, index) => {
        const status = contract.status === 'success' ? '✅' : contract.status === 'pending' ? '⏳' : '❌';
        const walletName = contract.wallet?.name || `Unknown Wallet (${contract.wallet?.address?.slice(0, 8)}...)` || 'Unknown Wallet';
        const safeWalletName = walletName.replace(/[`*_]/g, ''); // Escape Markdown characters
        const deployedDate = new Date(contract.deployed_at).toLocaleDateString();
        const shortAddress = contract.contract_address.slice(0, 10) + '...';
        const contractName = contract.contract_instance.name.replace(/[`*_]/g, ''); // Escape Markdown characters
        
        return `${index + 1}. ${status} *${contractName}*\n📅 Deployed: ${deployedDate}\n👛 Wallet: ${safeWalletName}\n📍 Address: \`${shortAddress}\``;
      }).join('\n\n');

      const screen = {
        title: "📋 My Deployed Contracts",
        description: `
*Your Deployed Contracts (${total})*

${contractList}

${total > 0 ? `Page ${page + 1} of ${Math.ceil(total / 5)}` : ''}`,
        footer: "Select a contract to view details 👇"
      };

      const keyboard = BotKeyboards.getDeployedContractsKeyboard(contracts, page, hasMore, total);
      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();

      // Store contracts in session for later use
      ctx.session.contractsState = {
        contracts: contracts,
        currentPage: page,
        total: total
      };

    } catch (error) {
      console.error('Error showing deployed contracts:', error);
      await ctx.reply('❌ Failed to load contracts. Please try again.');
    }
  }

  /**
   * Show contract details
   */
  static async showContractDetails(ctx: BotContext, contractId: string) {
    try {
      const contractResult = await this.deployedContractsService.getDeployedContractById(contractId);
      
      if (!contractResult.success || !contractResult.data) {
        await ctx.reply('❌ Contract not found. Please try again.');
        return;
      }

      const contract = contractResult.data;
      const walletName = contract.wallet?.name || `Unknown Wallet (${contract.wallet?.address?.slice(0, 8)}...)` || 'Unknown Wallet';
      const safeWalletName = walletName.replace(/[`*_]/g, ''); // Escape Markdown characters
      const deployedDate = new Date(contract.deployed_at).toLocaleString();
      const status = contract.status === 'success' ? '✅ Deployed' : contract.status === 'pending' ? '⏳ Pending' : '❌ Failed';
      
      const networkInfo = contract.network_info;
      const explorerLink = networkInfo?.block_explorer_url 
        ? `${networkInfo.block_explorer_url}/address/${contract.contract_address}`
        : null;

      const contractName = contract.contract_instance.name.replace(/[`*_]/g, ''); // Escape Markdown characters
      
      const screen = {
        title: `📋 ${contractName}`,
        description: `
*Contract Details*

📝 **Name:** ${contractName}
🔢 **Status:** ${status}
🌐 **Network:** ${networkInfo?.name || 'Unknown'}

📍 **Contract Address:**
\`${contract.contract_address}\`

🔗 **Transaction Hash:**
\`${contract.transaction_hash}\`

👛 **Deployer Wallet:**
${safeWalletName}

📅 **Deployed:** ${deployedDate}

${contract.gas_used ? `⛽ **Gas Used:** ${contract.gas_used}` : ''}
${contract.deployment_cost ? `💰 **Cost:** ${contract.deployment_cost} ETH` : ''}

${contract.error_message ? `❌ **Error:** ${contract.error_message}` : ''}`,
        footer: "Choose an action below 👇"
      };

      const keyboard = BotKeyboards.getContractDetailsKeyboard(contractId, explorerLink);
      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();

      // Store current contract in session
      ctx.session.contractsState = {
        ...ctx.session.contractsState,
        currentContract: contract
      };

    } catch (error) {
      console.error('Error showing contract details:', error);
      await ctx.reply('❌ Failed to load contract details. Please try again.');
    }
  }

  /**
   * Remove contract (soft delete)
   */
  static async removeContract(ctx: BotContext, contractId: string) {
    try {
      const result = await this.deployedContractsService.softDeleteContract(contractId);
      
      if (!result.success) {
        await ctx.answerCbQuery('❌ Failed to remove contract');
        return;
      }

      await ctx.answerCbQuery('✅ Contract removed successfully');
      
      // Go back to contracts list
      await this.showDeployedContracts(ctx, ctx.session.contractsState?.currentPage || 0);

    } catch (error) {
      console.error('Error removing contract:', error);
      await ctx.answerCbQuery('❌ Failed to remove contract');
    }
  }

  /**
   * Show contract removal confirmation
   */
  static async showRemoveConfirmation(ctx: BotContext, contractId: string) {
    try {
      const screen = {
        title: "🗑️ Remove Contract",
        description: `
*Confirm Removal*

Are you sure you want to remove this contract from your list?

⚠️ **Note:** This will only remove it from your view. The contract will remain deployed on the blockchain.

This action cannot be undone.`,
        footer: "Confirm your choice below 👇"
      };

      const keyboard = BotKeyboards.getRemoveConfirmationKeyboard(contractId);
      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();

    } catch (error) {
      console.error('Error showing remove confirmation:', error);
      await ctx.reply('❌ Failed to show confirmation. Please try again.');
    }
  }
} 