import { BotContext } from '../types';
import { BotScreens } from '../screens';
import { BotKeyboards } from '../keyboards';
import { DeployedContractsService } from '@eth-deployer/supabase';
import { CallbackManager } from '../callbacks';
import { ContractsScreens } from '../screens/contracts.screens';

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
   * Show enhanced contract details with status indicators
   */
  static async showContractDetails(ctx: BotContext, contractId: string) {
    try {
      const contractResult = await this.deployedContractsService.getDeployedContractById(contractId);
      
      if (!contractResult.success || !contractResult.data) {
        await ctx.reply('❌ Contract not found. Please try again.');
        return;
      }

      const contract = contractResult.data;
      
      // Get contract status (placeholder - implement actual status checking)
      const contractStatus = await this.getContractStatus(contract);
      
      // Format contract data for enhanced display
      const contractData = {
        name: contract.contract_instance.name,
        symbol: 'N/A', // TODO: Extract from contract parameters if available
        contract_address: contract.contract_address,
        network: contract.network_info?.name || 'Unknown',
        deployed_at: contract.deployed_at
      };

      const deployerWallet = {
        nickname: contract.wallet?.name || 'Unknown Wallet',
        address: contract.wallet?.address || 'N/A'
      };

      const message = ContractsScreens.detail(contractData, deployerWallet, contractStatus);
      const keyboard = BotKeyboards.getContractDetailsKeyboard(contractId, contract.network_info?.block_explorer_url);

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
   * Get contract status information
   */
  private static async getContractStatus(contract: any): Promise<any> {
    // TODO: Implement actual contract status checking
    // For now, return default status
    return {
      tradingOpen: false, // 🔴
      hasOwner: true,     // 🟢
      hasPool: false      // 🔴
    };
  }

  /**
   * Handle enhanced contract callbacks
   */
  static async handleEnhancedCallback(ctx: BotContext) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }
    
    const callbackData = ctx.callbackQuery.data as string;
    
    // Handle standard callbacks
    if (callbackData === 'contracts_view_deployed') {
      return this.showDeployedContracts(ctx, 0);
    }
    
    // Handle compressed callbacks
    if (callbackData.startsWith('c')) {
      const resolvedCallback = CallbackManager.resolveContractCallback(callbackData);
      
      if (!resolvedCallback) {
        await ctx.reply('❌ Invalid action. Please try again.');
        return;
      }
      
      const { action, data } = resolvedCallback;
      const contractId = data.contractId;
      
      switch (action) {
        case 'edit_name':
          return this.handleEditName(ctx, contractId);
        case 'copy':
          return this.handleCopyAddress(ctx, contractId);
        case 'refresh':
          return this.refreshContractStatus(ctx, contractId);
        case 'remove':
          return this.showRemoveConfirmation(ctx, contractId);
        case 'back_detail':
          return this.showContractDetails(ctx, contractId);
        
        // Direct operations (no longer need separate screens)
        case 'token_renounce':
          return this.handleTokenFunction(ctx, action, contractId);
        case 'token_open':
          return this.handleTokenFunction(ctx, action, contractId);
        case 'liq_create':
          return this.handleLiquidityFunction(ctx, action, contractId);
          
        // Legacy token functions (for backward compatibility)
        case 'token_transfer':
        case 'token_limits':
        case 'token_tax':
          return this.handleTokenFunction(ctx, action, contractId);
          
        // Legacy liquidity functions (for backward compatibility)
        case 'liq_add':
        case 'liq_remove':
        case 'liq_stats':
        case 'liq_refresh':
          return this.handleLiquidityFunction(ctx, action, contractId);
          
        default:
          await ctx.reply('❌ Unknown action.');
      }
    }
  }

  /**
   * Handle contract name editing
   */
  static async handleEditName(ctx: BotContext, contractId: string) {
    try {
      const contractResult = await this.deployedContractsService.getDeployedContractById(contractId);
      
      if (!contractResult.success || !contractResult.data) {
        await ctx.reply('❌ Contract not found.');
        return;
      }

      const contract = contractResult.data;
      const contractData = {
        name: contract.contract_instance.name,
        contract_address: contract.contract_address
      };

      ctx.session.editingContract = {
        id: contractId,
        field: 'name'
      };
      
      const message = ContractsScreens.nameEditing(contractData);
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🔙 Back to Contract', callback_data: CallbackManager.generateContractCallback('back_detail', contractId) }
          ]]
        }
      });
      await ctx.answerCbQuery();
      
      ctx.session.awaitingInput = 'contract_name';

    } catch (error) {
      console.error('Error handling edit name:', error);
      await ctx.reply('❌ Failed to open name editor.');
    }
  }

  /**
   * Process contract name input
   */
  static async handleNameInput(ctx: BotContext) {
    if (!ctx.message || !('text' in ctx.message)) {
      return;
    }
    
    const newName = ctx.message.text.trim();
    const contractId = ctx.session.editingContract?.id;
    
    if (!contractId || !newName || newName.length > 50) {
      await ctx.reply('❌ Invalid input. Name must be 1-50 characters.');
      return;
    }
    
    // TODO: Update contract name in database
    await ctx.reply(
      `✅ Contract name updated to: *${newName}*`,
      { parse_mode: 'Markdown' }
    );
    
    // Clear session
    ctx.session.editingContract = undefined;
    ctx.session.awaitingInput = undefined;
    
    // Return to contract details
    return this.showContractDetails(ctx, contractId);
  }

  /**
   * Handle copy address action
   */
  static async handleCopyAddress(ctx: BotContext, contractId: string) {
    try {
      const contractResult = await this.deployedContractsService.getDeployedContractById(contractId);
      
      if (!contractResult.success || !contractResult.data) {
        await ctx.reply('❌ Contract not found.');
        return;
      }

      const contract = contractResult.data;
      const contractData = {
        name: contract.contract_instance.name,
        contract_address: contract.contract_address
      };

      const message = ContractsScreens.copyAddress(contractData);
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🔙 Back to Contract', callback_data: CallbackManager.generateContractCallback('back_detail', contractId) }
          ]]
        }
      });
      await ctx.answerCbQuery();

    } catch (error) {
      console.error('Error handling copy address:', error);
      await ctx.reply('❌ Failed to copy address.');
    }
  }

  /**
   * Show token functions screen
   */
  static async showTokenFunctions(ctx: BotContext, contractId: string) {
    try {
      const contractResult = await this.deployedContractsService.getDeployedContractById(contractId);
      
      if (!contractResult.success || !contractResult.data) {
        await ctx.reply('❌ Contract not found.');
        return;
      }

      const contract = contractResult.data;
      const contractData = {
        name: contract.contract_instance.name
      };

      // TODO: Get actual token status
      const tokenStatus = {
        tradingOpen: false,
        hasOwner: true,
        hasLimits: true
      };

      const message = ContractsScreens.tokenFunctions(contractData, tokenStatus);
      const keyboard = BotKeyboards.getTokenFunctionsKeyboard(contractId);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();

    } catch (error) {
      console.error('Error showing token functions:', error);
      await ctx.reply('❌ Failed to load token functions.');
    }
  }

  /**
   * Show liquidity pool screen
   */
  static async showLiquidityPool(ctx: BotContext, contractId: string) {
    try {
      const contractResult = await this.deployedContractsService.getDeployedContractById(contractId);
      
      if (!contractResult.success || !contractResult.data) {
        await ctx.reply('❌ Contract not found.');
        return;
      }

      const contract = contractResult.data;
      const contractData = {
        name: contract.contract_instance.name
      };

      // TODO: Get actual pool info
      const poolInfo = {
        exists: false,
        ethReserves: '0',
        tokenReserves: '0',
        lpBalance: '0'
      };

      const message = ContractsScreens.liquidityPool(contractData, poolInfo);
      const keyboard = BotKeyboards.getLiquidityPoolKeyboard(contractId, poolInfo.exists);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();

    } catch (error) {
      console.error('Error showing liquidity pool:', error);
      await ctx.reply('❌ Failed to load liquidity pool info.');
    }
  }

  /**
   * Refresh contract status
   */
  static async refreshContractStatus(ctx: BotContext, contractId: string) {
    try {
      await ctx.answerCbQuery('🔄 Refreshing status...');
      
      // TODO: Implement actual status refresh
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate refresh
      
      // Return to contract details with refreshed status
      return this.showContractDetails(ctx, contractId);

    } catch (error) {
      console.error('Error refreshing contract status:', error);
      await ctx.reply('❌ Failed to refresh status.');
    }
  }

  /**
   * Handle token function execution
   */
  static async handleTokenFunction(ctx: BotContext, action: string, contractId: string) {
    try {
      await ctx.answerCbQuery('⚙️ Processing...');
      
      // TODO: Implement actual token function execution
      const functionNames: Record<string, string> = {
        'token_renounce': 'Renounce Ownership',
        'token_transfer': 'Transfer Ownership',
        'token_open': 'Open Trading',
        'token_limits': 'Remove Limits',
        'token_tax': 'Update Taxes'
      };
      
      const functionName = functionNames[action] || 'Unknown Function';
      
      await ctx.reply(
        `🔄 *${functionName}*\n\nThis function is not yet implemented.`,
        { parse_mode: 'Markdown' }
      );
      
      // Return to token functions
      return this.showTokenFunctions(ctx, contractId);

    } catch (error) {
      console.error('Error handling token function:', error);
      await ctx.reply('❌ Failed to execute token function.');
    }
  }

  /**
   * Handle liquidity function execution
   */
  static async handleLiquidityFunction(ctx: BotContext, action: string, contractId: string) {
    try {
      await ctx.answerCbQuery('💧 Processing...');
      
      // TODO: Implement actual liquidity function execution
      const functionNames: Record<string, string> = {
        'liq_create': 'Create Pool',
        'liq_add': 'Add Liquidity',
        'liq_remove': 'Remove Liquidity',
        'liq_stats': 'Pool Statistics',
        'liq_refresh': 'Refresh Info'
      };
      
      const functionName = functionNames[action] || 'Unknown Function';
      
      await ctx.reply(
        `💧 *${functionName}*\n\nThis function is not yet implemented.`,
        { parse_mode: 'Markdown' }
      );
      
      // Return to liquidity pool
      return this.showLiquidityPool(ctx, contractId);

    } catch (error) {
      console.error('Error handling liquidity function:', error);
      await ctx.reply('❌ Failed to execute liquidity function.');
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