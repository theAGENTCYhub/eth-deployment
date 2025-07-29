import { BotContext } from '../types';
import { ParameterEditorService } from '../../services/parameter-editor.service';
import { BotScreens, DeploymentScreens, ParameterEditingScreens } from '../screens';
import { BotKeyboards, DeploymentKeyboards, ParameterEditingKeyboards } from '../keyboards';
import { NavigationHandler } from './navigation.handler';
import { CompilationClientService } from '../../services/compilation-client.service';
import { CompiledArtifactsService } from '@eth-deployer/supabase';
import { WalletService } from '@eth-deployer/supabase';
import { DeploymentService } from '@eth-deployer/transactions/src/services/deployment/deployment.service';
import { ConfigurationService } from '../../services/configuration.service';

export class DeploymentHandler {
  private static parameterEditor = new ParameterEditorService();

  /**
   * Show template selection screen
   */
  static async showTemplateSelection(ctx: BotContext) {
    try {
      const templatesResult = await DeploymentHandler.parameterEditor.loadTemplates();
      
      if (!templatesResult.success || !templatesResult.data || templatesResult.data.length === 0) {
        await ctx.reply('❌ No contract templates available. Please try again later.');
        return;
      }

      const screen = DeploymentScreens.getTemplateSelectionScreen(templatesResult.data);
      const keyboard = DeploymentKeyboards.getTemplateSelectionKeyboard(templatesResult.data);
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
      console.error('Error showing template selection:', error);
      await ctx.reply('❌ Failed to load templates. Please try again.');
    }
  }

  /**
   * Show parameter editing screen with dynamic keyboard
   */
  static async showParameterEditing(ctx: BotContext, templateId: string) {
    try {
      const templateResult = await DeploymentHandler.parameterEditor.loadTemplate(templateId);
      
      if (!templateResult.success || !templateResult.data) {
        await ctx.reply('❌ Template not found. Please select another template.');
        return;
      }

      const template = templateResult.data;
      const discoveredParams = DeploymentHandler.parameterEditor.discoverParameters(template.source_code);
      
      if (discoveredParams.length === 0) {
        await ctx.reply('❌ No parameters found in this template. This template cannot be configured.');
        return;
      }

      // Load parameter definitions
      const paramDefsResult = await DeploymentHandler.parameterEditor.loadParameterDefinitions();
      const paramDefs = paramDefsResult.success ? paramDefsResult.data || [] : [];
      const definedKeys = new Set(paramDefs.map(d => d.parameter_key));
      const missingDefs = discoveredParams.filter(p => !definedKeys.has(p));

      // Always use the latest parameter values from the session or DB
      let instanceId: string | undefined = ctx.session.deployState?.instanceId;
      let parameterValues: Record<string, string> = {};
      if (instanceId) {
        // Reload from DB for latest values
        parameterValues = await DeploymentHandler.parameterEditor.getInstanceParameters(instanceId);
      } else {
        // Prepare initial parameter values using defaults
        for (const param of discoveredParams) {
          const def = paramDefs.find(d => d.parameter_key === param);
          parameterValues[param] = def && def.default_value != null ? def.default_value : '';
        }
        // Create a new contract instance in the database
        const saveResult = await DeploymentHandler.parameterEditor.saveContractInstance(
          ctx.from?.id?.toString() || 'unknown',
          templateId,
          `Draft_${Date.now()}`,
          Object.entries(parameterValues).map(([key, value]) => ({ key, value })),
          template.source_code
        );
        if (!saveResult.success || !saveResult.instanceId) {
          await ctx.reply('❌ Failed to create a new contract instance. Please try again.');
          return;
        }
        instanceId = saveResult.instanceId;
      }

      // Get wallet information if selected
      let walletInfo = '';
      let selectedWalletId = ctx.session.deployState?.selectedWalletId;
      if (selectedWalletId) {
        const walletService = new WalletService();
        const walletResult = await walletService.getAllWallets();
        const wallet = walletResult.success && walletResult.data ? walletResult.data.find(w => w.id === selectedWalletId) : undefined;
        if (wallet) {
          walletInfo = `*Selected Wallet:*\n• Address: \`${wallet.address}\`\n• Name: ${wallet.name || 'No nickname'}`;
        }
      }

      // Generate screen and keyboard
      let screen = ParameterEditingScreens.getParameterEditingScreen(template.name, discoveredParams, parameterValues, selectedWalletId, walletInfo);
      if (missingDefs.length > 0) {
        screen.description += `\n\n⚠️ *Warning: The following parameters are missing definitions and cannot be edited properly:*\n${missingDefs.map(p => `• ${p}`).join('\n')}`;
      }
      // Use category menu instead of the old keyboard
      const keyboard = ParameterEditingKeyboards.categoryMenu(instanceId, ctx);
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

      // Store template, parameters, and instance ID in session
      ctx.session.deployState = {
        step: 'parameter_editing',
        templateId,
        discoveredParams,
        parameterValues,
        instanceId,
        selectedWalletId: ctx.session.deployState?.selectedWalletId
      };

    } catch (error) {
      console.error('Error showing parameter editing:', error);
      await ctx.reply('❌ Failed to load template parameters. Please try again.');
    }
  }

  /**
   * Show single parameter editing screen
   */
  static async showSingleParameterEditing(ctx: BotContext, templateId: string, parameter: string) {
    try {
      if (!ctx.session.deployState) {
        await ctx.reply('❌ No parameter editing session active. Please start over.');
        return;
      }

      const paramDefsResult = await DeploymentHandler.parameterEditor.loadParameterDefinitions();
      const paramDefs = paramDefsResult.success ? paramDefsResult.data || [] : [];
      const paramDef = paramDefs.find(d => d.parameter_key === parameter);
      
      const currentValue = ctx.session.deployState.parameterValues?.[parameter] || '';
      const type = paramDef?.data_type || 'string';
      const description = paramDef?.description || 'No description available';
      const isRequired = paramDef?.is_required || false;

      // Generate screen and keyboard
      const screen = ParameterEditingScreens.getSingleParameterScreen(parameter, type, description, currentValue, isRequired);
      // Use a simple back keyboard instead of the old one
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Categories', callback_data: 'back_categories' }],
            [{ text: '❌ Abort', callback_data: 'action_abort_deployment' }]
          ]
        }
      };
      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();

      // Update session to indicate we're editing a specific parameter
      ctx.session.deployState.currentParameter = parameter;
      ctx.session.deployState.step = 'editing_single_parameter';

    } catch (error) {
      console.error('Error showing single parameter editing:', error);
      await ctx.reply('❌ Failed to load parameter editor. Please try again.');
    }
  }

  /**
   * Handle single parameter input
   */
  static async handleSingleParameterInput(ctx: BotContext) {
    try {
      if (!ctx.session.deployState || ctx.session.deployState.step !== 'editing_single_parameter') {
        await ctx.reply('❌ No parameter editing session active. Please start over.');
        return;
      }

      const input = ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
      if (!input) {
        await ctx.reply('❌ Please provide a value for the parameter.');
        return;
      }

      const { templateId, currentParameter, parameterValues, instanceId } = ctx.session.deployState;
      if (!templateId || !currentParameter || !instanceId) {
        await ctx.reply('❌ Missing template, parameter, or instance information. Please start over.');
        return;
      }

      // Validate the single parameter
      const validationResult = await DeploymentHandler.parameterEditor.validateParameters([{ key: currentParameter, value: input }]);

      if (!validationResult.success && validationResult.errors) {
        const errorMessage = `❌ Invalid value for ${currentParameter}:\n\n${validationResult.errors.join('\n')}`;
        await ctx.reply(errorMessage);
        return;
      }

      // Store the validated parameter value
      const updatedValues = { ...parameterValues, [currentParameter]: input };
      ctx.session.deployState.parameterValues = updatedValues;
      ctx.session.deployState.step = 'parameter_editing';
      delete ctx.session.deployState.currentParameter;

      // Persist to database
      await DeploymentHandler.parameterEditor.updateInstanceParameters(instanceId, updatedValues);

      // Return to parameter editing screen
      await DeploymentHandler.showParameterEditing(ctx, templateId);

    } catch (error) {
      console.error('Error handling single parameter input:', error);
      await ctx.reply('❌ Failed to process parameter value. Please try again.');
    }
  }

  /**
   * Reset all parameters
   */
  static async resetAllParameters(ctx: BotContext) {
    try {
      if (!ctx.session.deployState) {
        await ctx.reply('❌ No parameter editing session active. Please start over.');
        return;
      }

      const { templateId } = ctx.session.deployState;
      if (!templateId) {
        await ctx.reply('❌ Missing template information. Please start over.');
        return;
      }

      // Reset parameter values
      ctx.session.deployState.parameterValues = {};
      ctx.session.deployState.step = 'parameter_editing';

      await ctx.answerCbQuery('✅ All parameters reset');
      
      // Return to parameter editing screen
              await DeploymentHandler.showParameterEditing(ctx, templateId);

    } catch (error) {
      console.error('Error resetting parameters:', error);
      await ctx.reply('❌ Failed to reset parameters. Please try again.');
    }
  }

  /**
   * Abort deployment
   */
  static async abortDeployment(ctx: BotContext) {
    try {
      // Clear deployment state
      ctx.session.deployState = undefined;
      ctx.session.currentScreen = 'home';

      await ctx.answerCbQuery('❌ Deployment aborted');
      
      // Return to home screen
      await NavigationHandler.goHome(ctx);

    } catch (error) {
      console.error('Error aborting deployment:', error);
      await ctx.reply('❌ Failed to abort deployment. Please try again.');
    }
  }

  /**
   * Show wallet selection screen after parameter editing
   */
  static async showWalletSelection(ctx: BotContext) {
    try {
      const walletService = new WalletService();
      const userId = ctx.from?.id?.toString() || 'unknown';
      const walletsResult = await walletService.getWalletsByUser(userId);
      if (!walletsResult.success || !walletsResult.data || walletsResult.data.length === 0) {
        await ctx.reply('❌ No wallets found. Please add a wallet before deploying.');
        return;
      }
      const wallets: any[] = walletsResult.data;
      const screen = DeploymentScreens.getWalletSelectionScreen(wallets);
      const keyboard = {
        reply_markup: {
          inline_keyboard: wallets.map((w: any, i: number) => [
            { text: `${i + 1}. ${w.name || w.address.slice(0, 8)}`, callback_data: `select_wallet_${w.id}` }
          ])
        }
      };
      await ctx.reply(BotScreens.formatScreen(screen), {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      if (ctx.session.deployState) ctx.session.deployState.step = 'wallet_selection';
    } catch (error) {
      await ctx.reply('❌ Failed to load wallets. Please try again.');
    }
  }

  /**
   * Handle wallet selection callback
   */
  static async handleWalletSelection(ctx: BotContext, walletId: string) {
    if (!ctx.session.deployState) return;
    ctx.session.deployState.selectedWalletId = walletId;
    ctx.session.deployState.step = 'wallet_selected';
    
    // Show confirmation that wallet was selected and return to parameter editing
    await ctx.answerCbQuery(`✅ Wallet selected! You can now confirm your parameters.`);
    
    // Return to parameter editing screen
    if (ctx.session.deployState.templateId) {
              await DeploymentHandler.showParameterEditing(ctx, ctx.session.deployState.templateId);
    } else {
      await ctx.reply('❌ Template not found. Please start over.');
    }
  }

  /**
   * Show parameter confirmation screen
   */
  static async showParameterConfirmation(ctx: BotContext) {
    try {
      if (!ctx.session.deployState || !ctx.session.deployState.parameterValues) {
        await ctx.reply('❌ No parameters to confirm. Please start over.');
        return;
      }
      const { templateId, parameterValues, developerWalletId } = ctx.session.deployState;
      if (!templateId || !parameterValues) {
        await ctx.reply('❌ Missing template or parameters. Please start over.');
        return;
      }
      
      // Check if developer wallet is selected
      if (!developerWalletId) {
        await ctx.reply('❌ No developer wallet selected. Please select a wallet first.');
        await DeploymentHandler.handleDeveloperWalletSelection(ctx);
        return;
      }
      
      const templateResult = await DeploymentHandler.parameterEditor.loadTemplate(templateId);
      if (!templateResult.success || !templateResult.data) {
        await ctx.reply('❌ Template not found. Please start over.');
        return;
      }
      
      let walletInfo = '';
      if (developerWalletId) {
        const walletService = new WalletService();
        const walletResult = await walletService.getAllWallets();
        const wallet = walletResult.success && walletResult.data ? walletResult.data.find(w => w.id === developerWalletId) : undefined;
        if (wallet) {
          walletInfo = `\n\n*Developer Wallet:*\n• Address: \`${wallet.address}\`\n• Name: ${wallet.name || 'No nickname'}`;
        }
      }
      
      const template = templateResult.data;
      const paramArray = Object.entries(parameterValues).map(([key, value]) => ({ key, value }));
      const modifiedSource = DeploymentHandler.parameterEditor.replaceParameters(template.source_code, paramArray);
      const screen = ParameterEditingScreens.getParameterConfirmationScreen(
        template.name,
        parameterValues,
        modifiedSource,
        process.env.NETWORK || 'Local'
      );
      // Add wallet info to confirmation
      screen.description += walletInfo;
      const keyboard = DeploymentKeyboards.getDeploymentConfirmationKeyboard();
      const message = BotScreens.formatScreen(screen);
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      ctx.session.deployState.modifiedSource = modifiedSource;
      ctx.session.deployState.step = 'ready_to_deploy';
    } catch (error) {
      await ctx.reply('❌ Failed to confirm parameters. Please try again.');
    }
  }

  /**
   * Start deployment process
   */
  static async startDeployment(ctx: BotContext) {
    try {
      if (!ctx.session.deployState || ctx.session.deployState.step !== 'ready_to_deploy') {
        await ctx.reply('❌ Not ready to deploy. Please configure parameters and select a wallet first.');
        return;
      }
      const { templateId, parameterValues, modifiedSource, instanceId, developerWalletId } = ctx.session.deployState;
      if (!templateId || !parameterValues || !modifiedSource || !instanceId || !developerWalletId) {
        await ctx.reply('❌ Missing deployment data or developer wallet. Please start over.');
        return;
      }

      // Show compilation progress
      const progressScreen = DeploymentScreens.getCompilationProgressScreen();
      await ctx.editMessageText(BotScreens.formatScreen(progressScreen), {
        parse_mode: 'Markdown'
      });

      // Load template to get contract name
      const templateResult = await DeploymentHandler.parameterEditor.loadTemplate(templateId);
      if (!templateResult.success || !templateResult.data) {
        await ctx.reply('❌ Template not found. Please start over.');
        return;
      }
      
      // Extract contract class name from source code
      const contractNameMatch = modifiedSource.match(/contract\s+(\w+)\s+is\s+Context,\s+IERC20,\s+Ownable/);
      const contractName = contractNameMatch ? contractNameMatch[1] : 'TOKEN';
      
      // Check for constructor parameters
      const constructorMatch = modifiedSource.match(/constructor\s*\(([^)]*)\)/);
      const constructorParams = constructorMatch ? constructorMatch[1].trim() : '';
      
      console.log('🔍 Extracted contract name:', contractName);
      console.log('🔍 Constructor parameters:', constructorParams);
      console.log('🔍 Constructor match:', constructorMatch);

      // Compile contract
      const compilationClient = new CompilationClientService();
      let compileResult;
      try {
        compileResult = await compilationClient.compileContract(modifiedSource, contractName);
      } catch (compileError) {
        console.error('Compilation error:', compileError);
        await ctx.reply('❌ Contract compilation failed. Please check your parameters and try again.');
        return;
      }

      if (!compileResult.success) {
        console.error('Compilation failed:', compileResult.error);
        await ctx.reply(`❌ Compilation failed: ${compileResult.error || 'Unknown error'}`);
        return;
      }

      console.log('✅ Compilation successful!');
      console.log('📋 Compilation result:', compileResult);

      // Show compilation success
      const compilationScreen = DeploymentScreens.getCompilationSuccessScreen();
      await ctx.editMessageText(BotScreens.formatScreen(compilationScreen), {
        parse_mode: 'Markdown'
      });

      // Deploy contract to blockchain
      const deploymentService = new DeploymentService();
      
      // Extract constructor arguments from parameter values
      // The database template constructor takes no parameters, so we pass an empty array
      const constructorArgs: any[] = [];
      
      console.log('🚀 Starting blockchain deployment...');
      console.log('Parameter values:', parameterValues);
      console.log('Constructor args:', constructorArgs);
      console.log('Modified source length:', modifiedSource.length);
      console.log('Modified source preview:', modifiedSource.substring(0, 500));
      
      const deploymentResult = await deploymentService.deployContract({
        walletId: developerWalletId,
        bytecode: compileResult.bytecode,
        abi: compileResult.abi,
        constructorArgs: constructorArgs,
        instanceId: instanceId
      });

      console.log('📋 Deployment result:', deploymentResult);

      if (deploymentResult.success && deploymentResult.data) {
        console.log('✅ Deployment successful!');
        
        // Show success screen
        await DeploymentHandler.showDeploymentSuccess(ctx, {
          contractAddress: deploymentResult.data.contractAddress,
          transactionHash: deploymentResult.data.hash,
          gasUsed: 'N/A', // Could be extracted from deployment result if needed
          deploymentCost: 'N/A' // Could be calculated if needed
        });
      } else {
        console.log('❌ Deployment failed:', deploymentResult.error);
        await DeploymentHandler.showDeploymentError(ctx, deploymentResult.error || 'Deployment failed');
      }

    } catch (error) {
      console.error('Error during compilation/deployment:', error);
      await DeploymentHandler.showDeploymentError(ctx, error instanceof Error ? error.message : 'Deployment failed');
    }
  }

  /**
   * Show deployment success
   */
  static async showDeploymentSuccess(ctx: BotContext, deploymentResult: any) {
    try {
      const screen = DeploymentScreens.getDeploymentSuccessScreen(deploymentResult);

      const keyboard = DeploymentKeyboards.getDeploymentSuccessKeyboard();
      const message = BotScreens.formatScreen(screen);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });

    } catch (error) {
      console.error('Error showing deployment success:', error);
      await ctx.reply('❌ Failed to show deployment success.');
    }
  }

  /**
   * Show deployment error
   */
  static async showDeploymentError(ctx: BotContext, errorMessage: string) {
    try {
      const screen = DeploymentScreens.getDeploymentErrorScreen(errorMessage);
      const keyboard = DeploymentKeyboards.getDeploymentErrorKeyboard();
      const message = BotScreens.formatScreen(screen);
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
    } catch (error) {
      console.error('Error showing deployment error:', error);
      await ctx.reply('❌ Failed to show deployment error.');
    }
  }

  /**
   * Handle choose wallet callback from parameter editing
   */
  static async handleChooseWallet(ctx: BotContext) {
    await DeploymentHandler.showWalletSelection(ctx);
  }

  /**
   * Show parameter categories instead of long list
   */
  static async showParameterCategories(ctx: BotContext) {
    const instanceId = ctx.session.deployState?.instanceId;
    if (!instanceId) {
      await ctx.reply('❌ No active editing session found.');
      return;
    }
    try {
      const parameterEditor = new ParameterEditorService();
      const result = await parameterEditor.getInstanceParameters(instanceId);
      if (!result) {
        await ctx.reply('❌ Failed to load parameters.');
        return;
      }
      // Convert Record<string, string> to array format for calculateCategoryStatus
      const parametersArray = Object.entries(result).map(([key, value]) => ({
        parameter_key: key,
        current_value: value
      }));
      // Calculate category completion status
      const categories = DeploymentHandler.calculateCategoryStatus(parametersArray);
      // Get developer wallet info if selected
      let devWalletInfo = '';
      const devWalletId = ctx.session.deployState?.developerWalletId;
      if (devWalletId) {
        const walletService = new WalletService();
        const walletResult = await walletService.getAllWallets();
        const wallet = walletResult.success && walletResult.data ? walletResult.data.find(w => w.id === devWalletId) : undefined;
        if (wallet) {
          devWalletInfo = `${wallet.name || wallet.address}`;
        }
      }
      await ctx.reply(
        ParameterEditingScreens.categoryMenu(instanceId, categories, devWalletInfo),
        ParameterEditingKeyboards.categoryMenu(instanceId, ctx)
      );
    } catch (error) {
      await ctx.reply('❌ An error occurred while loading the parameter editor.');
    }
  }

  /**
   * Handle developer wallet selection
   */
  static async handleDeveloperWalletSelection(ctx: BotContext) {
    // Show a list of wallets for the user to select
    const walletService = new WalletService();
    const userId = ctx.from?.id?.toString() || 'unknown';
    const walletsResult = await walletService.getWalletsByUser(userId);
    if (!walletsResult.success || !walletsResult.data || walletsResult.data.length === 0) {
      await ctx.reply('❌ No wallets found. Please add a wallet before selecting.');
      return;
    }
    const wallets: any[] = walletsResult.data;
    const keyboard = ParameterEditingKeyboards.devWalletSelectionKeyboard(wallets, ctx);
    await ctx.reply('👤 *Select Developer Wallet*\n\nChoose a wallet to use for deployment:', { parse_mode: 'Markdown', ...keyboard });
  }

  /**
   * Handle developer wallet selection callback
   */
  static async handleDeveloperWalletSelected(ctx: BotContext, walletId: string) {
    if (!ctx.session.deployState) return;
    ctx.session.deployState.developerWalletId = walletId;
    await ctx.answerCbQuery('✅ Developer wallet selected!');
    // Return to parameter categories
    await DeploymentHandler.showParameterCategories(ctx);
  }

  // Add a handler for finish editing
  static async handleFinishEditing(ctx: BotContext) {
    // Check if developer wallet is selected
    const devWalletId = ctx.session.deployState?.developerWalletId;
    if (!devWalletId) {
      await ctx.reply('❌ No wallet selected. Please select a wallet first.');
      await DeploymentHandler.handleDeveloperWalletSelection(ctx);
      return;
    }
    // Proceed to deployment review/confirmation
    await DeploymentHandler.showParameterConfirmation(ctx);
  }

  /**
   * Calculate completion status for each category
   */
  static calculateCategoryStatus(parameters: any[]): any {
    const categories = {
      basic: { count: 0, completed: false, total: 4 },
      taxes: { count: 0, completed: false, total: 5 },
      trading: { count: 0, completed: false, total: 3 },
      limits: { count: 0, completed: false, total: 4 },
      advanced: { count: 0, completed: false, total: 1 }
    };
    parameters.forEach(param => {
      const hasValue = param.current_value && param.current_value.trim() !== '';
      if ([
        'TOKEN_NAME', 'TOKEN_SYMBOL', 'TOTAL_SUPPLY', 'DECIMALS'
      ].includes(param.parameter_key)) {
        if (hasValue) categories.basic.count++;
      } else if ([
        'INITIAL_BUY_TAX', 'INITIAL_SELL_TAX', 'FINAL_BUY_TAX', 'FINAL_SELL_TAX', 'TRANSFER_TAX'
      ].includes(param.parameter_key)) {
        if (hasValue) categories.taxes.count++;
      } else if ([
        'REDUCE_BUY_TAX_AT', 'REDUCE_SELL_TAX_AT', 'PREVENT_SWAP_BEFORE'
      ].includes(param.parameter_key)) {
        if (hasValue) categories.trading.count++;
      } else if ([
        'MAX_TX_AMOUNT_PERCENT', 'MAX_WALLET_SIZE_PERCENT', 'TAX_SWAP_LIMIT_PERCENT', 'MAX_SWAP_LIMIT_PERCENT'
      ].includes(param.parameter_key)) {
        if (hasValue) categories.limits.count++;
      } else if ([
        'TAX_WALLET'
      ].includes(param.parameter_key)) {
        if (hasValue) categories.advanced.count++;
      }
    });
    // Mark categories as completed if all parameters have values
    categories.basic.completed = categories.basic.count === categories.basic.total;
    categories.taxes.completed = categories.taxes.count === categories.taxes.total;
    categories.trading.completed = categories.trading.count === categories.trading.total;
    categories.limits.completed = categories.limits.count === categories.limits.total;
    categories.advanced.completed = categories.advanced.count === categories.advanced.total;
    return categories;
  }

  /**
   * Handle category navigation and parameter editing
   */
  static async handleCategoryNavigation(ctx: BotContext, category: string) {
    const instanceId = ctx.session.deployState?.instanceId;
    if (!instanceId) {
      await ctx.reply('❌ No active editing session found.');
      return;
    }
    try {
      const parameterEditor = new ParameterEditorService();
      const result = await parameterEditor.getInstanceParameters(instanceId);
      if (!result) {
        await ctx.reply('❌ Failed to load parameters.');
        return;
      }
      const parametersArray = Object.entries(result).map(([key, value]) => ({ parameter_key: key, current_value: value }));
      const keyboard = ParameterEditingKeyboards.categoryKeyboard(parametersArray, instanceId, category, ctx);
      await ctx.reply(
        `⚙️ *${category.charAt(0).toUpperCase() + category.slice(1)} Parameters*\n\nSelect a parameter to edit:`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    } catch (error) {
      await ctx.reply('❌ An error occurred while loading the category.');
    }
  }

  /**
   * Handle save configuration
   */
  static async handleSaveConfiguration(ctx: BotContext) {
    ctx.session.awaitingInput = 'config_name';
    ctx.session.currentInstanceId = ctx.session.deployState?.instanceId;
    await ctx.reply(
      '💾 *Save Configuration*\n\nEnter a name for this configuration:',
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * Handle configuration name input
   */
  static async handleConfigurationNameInput(ctx: BotContext) {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('❌ Invalid message format.');
      return;
    }
    const configName = ctx.message.text.trim();
    if (!configName || configName.length > 30) {
      await ctx.reply('❌ Configuration name must be 1-30 characters.');
      return;
    }
    try {
      const configService = new ConfigurationService();
      if (!ctx.from) {
        await ctx.reply('❌ User information not available.');
        return;
      }
      const userId = ctx.from.id.toString();
      const instanceId = ctx.session.currentInstanceId;
      const templateId = ctx.session.deployState?.templateId;
      if (!templateId) {
        await ctx.reply('❌ Template information not available.');
        return;
      }
      if (!instanceId) {
        await ctx.reply('❌ Instance information not available.');
        return;
      }
      const result = await configService.saveConfiguration(
        userId,
        configName,
        instanceId,
        templateId
      );
      if (result.success) {
        await ctx.reply(
          `✅ Configuration "*${configName}*" saved successfully!`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(`❌ Failed to save configuration: ${result.error}`);
      }
      ctx.session.awaitingInput = undefined;
      // Return to parameter categories
      return DeploymentHandler.showParameterCategories(ctx);
    } catch (error) {
      await ctx.reply('❌ An error occurred while saving the configuration.');
      ctx.session.awaitingInput = undefined;
    }
  }

  /**
   * Handle load configuration
   */
  static async handleLoadConfiguration(ctx: BotContext) {
    try {
      const configService = new ConfigurationService();
      if (!ctx.from) {
        await ctx.reply('❌ User information not available.');
        return;
      }
      const userId = ctx.from.id.toString();
      const result = await configService.getUserConfigurations(userId);
      if (!result.success || !result.data || result.data.length === 0) {
        await ctx.reply('📂 No saved configurations found.');
        return DeploymentHandler.showParameterCategories(ctx);
      }
      // Show saved configurations list
      const keyboard = {
        reply_markup: {
          inline_keyboard: result.data.map(config => [
            { 
              text: `📋 ${config.name}`, 
              callback_data: `load_config_${config.id}` 
            }
          ]).concat([[
            { text: '🔙 Back to Categories', callback_data: 'back_categories' }
          ]])
        }
      };
      await ctx.reply(
        '📂 *Load Configuration*\n\nSelect a configuration to load:',
        { parse_mode: 'Markdown', ...keyboard }
      );
    } catch (error) {
      await ctx.reply('❌ An error occurred while loading configurations.');
    }
  }

  /**
   * Handle load configuration selection
   */
  static async handleLoadConfigurationSelection(ctx: BotContext, configId: string) {
    try {
      const configService = new ConfigurationService();
      if (!ctx.from) {
        await ctx.reply('❌ User information not available.');
        return;
      }
      const userId = ctx.from.id.toString();
      const instanceId = ctx.session.deployState?.instanceId;
      if (!instanceId) {
        await ctx.reply('❌ No active editing session found.');
        return;
      }
      const result = await configService.loadConfiguration(userId, configId, instanceId);
      if (result.success) {
        await ctx.reply('✅ Configuration loaded successfully!');
      } else {
        await ctx.reply(`❌ Failed to load configuration: ${result.error}`);
      }
      // Return to parameter categories
      return DeploymentHandler.showParameterCategories(ctx);
    } catch (error) {
      await ctx.reply('❌ An error occurred while loading the configuration.');
    }
  }

  // TODO: Add handler for '📋 My Contracts' to list active deployments (paginated)
  // TODO: Add contract detail view (show name, address, date, wallet, with 'Unknown Wallet' fallback)
  // TODO: Add soft delete (remove contract) option with confirmation
  // TODO: Integrate with screens and keyboards as needed
  // TODO: Use short_id for all references
  // TODO: Only show active contracts
  // TODO: Add navigation back to home
  // TODO: Add clear comments for each section
  // TODO: Add TODOs for any missing integration points
} 