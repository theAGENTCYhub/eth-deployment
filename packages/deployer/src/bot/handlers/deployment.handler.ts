import { BotContext } from '../types';
import { ParameterEditorService } from '../../services/parameter-editor.service';
import { BotScreens, DeploymentScreens, ParameterEditingScreens } from '../screens';
import { BotKeyboards, DeploymentKeyboards, ParameterEditingKeyboards } from '../keyboards';
import { NavigationHandler } from './navigation.handler';
import { CompilationClientService } from '../../services/compilation-client.service';
import { CompiledArtifactsService } from '@eth-deployer/supabase';
import { WalletService } from '@eth-deployer/supabase';
import { DeploymentService } from '@eth-deployer/transactions/src/services/deployment/deployment.service';

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
      const keyboard = ParameterEditingKeyboards.getParameterEditingKeyboard(templateId, discoveredParams, parameterValues);
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
      const keyboard = ParameterEditingKeyboards.getSingleParameterKeyboard(templateId, parameter);
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
      const { templateId, parameterValues, selectedWalletId } = ctx.session.deployState;
      if (!templateId || !parameterValues) {
        await ctx.reply('❌ Missing template or parameters. Please start over.');
        return;
      }
      
      // Check if wallet is selected
      if (!selectedWalletId) {
        await ctx.reply('❌ No wallet selected. Please select a wallet first.');
        await DeploymentHandler.showParameterEditing(ctx, templateId);
        return;
      }
      const templateResult = await DeploymentHandler.parameterEditor.loadTemplate(templateId);
      if (!templateResult.success || !templateResult.data) {
        await ctx.reply('❌ Template not found. Please start over.');
        return;
      }
      let walletInfo = '';
      if (selectedWalletId) {
        const walletService = new WalletService();
        const walletResult = await walletService.getAllWallets();
        const wallet = walletResult.success && walletResult.data ? walletResult.data.find(w => w.id === selectedWalletId) : undefined;
        if (wallet) {
          walletInfo = `\n\n*Selected Wallet:*\n• Address: \`${wallet.address}\`\n• Name: ${wallet.name || 'No nickname'}`;
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
      const { templateId, parameterValues, modifiedSource, instanceId, selectedWalletId } = ctx.session.deployState;
      if (!templateId || !parameterValues || !modifiedSource || !instanceId || !selectedWalletId) {
        await ctx.reply('❌ Missing deployment data or wallet. Please start over.');
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
        console.log('🔄 Sending compilation request...');
        console.log('Contract name:', contractName);
        console.log('Source code length:', modifiedSource.length);
        
        compileResult = await compilationClient.compileContract(modifiedSource, contractName);
        
        console.log('📦 Compilation result:', compileResult);
      } catch (error) {
        console.error('❌ Compilation error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        await DeploymentHandler.showDeploymentError(ctx, 'Compilation service error: ' + errorMessage);
        return;
      }

      if (!compileResult || !('success' in compileResult) || !compileResult.success) {
        const errorMsg = (compileResult && 'error' in compileResult && compileResult.error) ? compileResult.error : 'Unknown compilation error';
        await DeploymentHandler.showDeploymentError(ctx, 'Compilation failed: ' + errorMsg);
        return;
      }

      // Save compilation artifact to database
      const compiledArtifactsService = new CompiledArtifactsService();
      const artifactSaveResult = await compiledArtifactsService.createCompiledArtifact({
        instance_id: instanceId,
        artifacts: compileResult
      });
      if (!artifactSaveResult.success) {
        await DeploymentHandler.showDeploymentError(ctx, 'Failed to save compiled artifact: ' + (artifactSaveResult.error || 'Unknown error'));
        return;
      }

      // Show deployment progress
      const deploymentProgressScreen = {
        title: "🚀 Deploying Contract...",
        description: `
*Deployment in Progress*

✅ Contract compiled successfully
🔄 Deploying to blockchain...
🔄 Waiting for confirmation...

This may take a few moments. Please wait...`,
        footer: "Do not close this window ⏳"
      };
      await ctx.editMessageText(BotScreens.formatScreen(deploymentProgressScreen), {
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
        walletId: selectedWalletId,
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