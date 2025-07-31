import { Markup } from 'telegraf';
import { DeploymentConfigurationService } from '../../../services/deployment-configuration.service';
import { DeploymentParameterEditorService } from '../../../services/deployment-parameter-editor.service';
import { BotContext } from '../../types';
import { DeploymentConfigsScreens } from '../../screens/settings/deployment-configs.screens';
import { DeploymentConfigsKeyboards } from '../../keyboards/settings/deployment-configs.keyboards';

export class DeploymentConfigsHandler {
  private static service = new DeploymentConfigurationService();
  private static parameterEditor = new DeploymentParameterEditorService();

  static async listConfigs(ctx: BotContext) {
    try {
      const userId = ctx.from?.id.toString();
      if (!userId) {
        await ctx.reply('❌ User ID not found');
        return;
      }

      const result = await this.service.getConfigsByUser(userId);
      if (!result.success || !result.data) {
        await ctx.reply('❌ Failed to load deployment configurations');
        return;
      }

      const configs = result.data || [];
      const message = DeploymentConfigsScreens.listConfigs(configs);
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('➕ New Configuration', 'dep_cfg_new')],
        ...configs.map((config: any, index: number) => [
          Markup.button.callback(`${index + 1}. ${config.name}`, `dep_cfg_view_${config.id}`)
        ]),
        [Markup.button.callback('🔙 Back to Settings', 'action_settings')]
      ]);

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
      console.error('Error listing deployment configs:', error);
      await ctx.reply('❌ Failed to load deployment configurations');
    }
  }

  static async createConfig(ctx: BotContext) {
    try {
      console.log('Creating deployment config...');
      const userId = ctx.from?.id.toString();
      if (!userId) {
        const errorMsg = await ctx.reply('❌ User ID not found', {
          reply_markup: { inline_keyboard: [[{ text: '🗑️ Delete', callback_data: 'delete_msg' }]] }
        });
        return;
      }

      // Clear other config session states to prevent conflicts
      this.clearOtherConfigSessions(ctx);

      // Initialize default config with default parameters
      const paramDefsResult = await this.parameterEditor.loadParameterDefinitions();
      const paramDefs = paramDefsResult.success ? paramDefsResult.data || [] : [];
      
      const defaultParameters: Record<string, string> = {};
      paramDefs.forEach(def => {
        defaultParameters[def.parameter_key] = def.default_value || '';
      });

      const defaultConfig = {
        name: '',
        parameters: defaultParameters
      };

      ctx.session.deploymentConfigEdit = { ...defaultConfig };
      ctx.session.deploymentConfigMode = 'create';
      ctx.session.deploymentConfigProgress = {};

      // Show parameter categories instead of simple edit screen
      await this.showParameterCategories(ctx);
    } catch (error) {
      console.error('Error creating deployment config:', error);
      const errorMsg = await ctx.reply('❌ Failed to create deployment configuration', {
        reply_markup: { inline_keyboard: [[{ text: '🗑️ Delete', callback_data: 'delete_msg' }]] }
      });
    }
  }

  private static getEditScreenMessage(config: any, isNew: boolean = false): string {
    const progress = this.getProgress(config);
    const progressText = Object.values(progress).filter(Boolean).length > 0 
      ? `\n\n📊 **Progress:** ${Object.values(progress).filter(Boolean).length}/3 fields completed`
      : '';

    const title = isNew ? '🆕 **Create New Deployment Configuration**' : `✏️ **Edit Configuration: ${config.name}**`;

    return `${title}${progressText}

📝 **Name:** ${config.name || 'Not set'} (required)
📋 **Template:** ${config.template_id || 'Not set'} (optional)
⚙️ **Parameters:** ${Object.keys(config.parameters || {}).length} items (optional)

Click a button below to edit a field, then click Save when done.`;
  }

  private static getProgress(config: any): any {
    return {
      name: !!config.name,
      template_id: !!config.template_id,
      parameters: Object.keys(config.parameters || {}).length > 0
    };
  }

  private static getEditKeyboard(config: any, isNew: boolean = false) {
    const progress = this.getProgress(config);
    const configId = config.id || 'new';
    
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: `${progress.name ? '✅' : '📝'} Name`, callback_data: `dep_cfg_name_${configId}` },
            { text: `${progress.template_id ? '✅' : '📋'} Template`, callback_data: `dep_cfg_template_${configId}` }
          ],
          [
            { text: `${progress.parameters ? '✅' : '⚙️'} Parameters`, callback_data: `dep_cfg_params_${configId}` }
          ],
          [
            { text: isNew ? '💾 Create' : '💾 Save', callback_data: `dep_cfg_save_${configId}` },
            { text: '❌ Cancel', callback_data: `dep_cfg_cancel_${configId}` }
          ]
        ]
      }
    };
  }

  static async viewConfig(ctx: BotContext, configId: string) {
    try {
      const result = await this.service.getConfigById(configId);
      if (!result.success || !result.data) {
        await ctx.reply('❌ Configuration not found');
        return;
      }

      const config = result.data;
      const message = DeploymentConfigsScreens.viewConfig(config);
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Edit', `dep_cfg_edit_${configId}`)],
        [Markup.button.callback('🗑️ Delete', `dep_cfg_delete_${configId}`)],
        [Markup.button.callback('🔙 Back to List', 'dep_cfg_list')]
      ]);

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
      console.error('Error viewing deployment config:', error);
      await ctx.reply('❌ Failed to load configuration');
    }
  }

  static async editConfig(ctx: BotContext, configId: string) {
    try {
      const result = await this.service.getConfigById(configId);
      if (!result.success || !result.data) {
        await ctx.reply('❌ Configuration not found');
        return;
      }

      ctx.session.deploymentConfigEdit = { ...result.data };
      ctx.session.deploymentConfigMode = 'edit';
      ctx.session.deploymentConfigProgress = this.getProgress(result.data);

      // Show parameter categories instead of simple edit screen
      await this.showParameterCategories(ctx);
    } catch (error) {
      console.error('Error editing deployment config:', error);
      await ctx.reply('❌ Failed to edit configuration');
    }
  }

  static async deleteConfig(ctx: BotContext, configId: string) {
    try {
      const result = await this.service.deleteConfig(configId);
      if (!result.success) {
        await ctx.reply('❌ Failed to delete configuration');
        return;
      }

      await ctx.reply('✅ Configuration deleted successfully');
      await this.listConfigs(ctx);
    } catch (error) {
      console.error('Error deleting deployment config:', error);
      await ctx.reply('❌ Failed to delete configuration');
    }
  }

  static async handleEditParam(ctx: BotContext, param: string) {
    try {
      if (!ctx.session.deploymentConfigEdit) {
        await ctx.reply('❌ No configuration being edited');
        return;
      }

      // Handle name editing separately
      if (param === 'name') {
        ctx.session.awaitingConfigParam = param;
        await ctx.reply(`Enter new value for *Configuration Name*:`, { parse_mode: 'Markdown' });
        return;
      }

      // For parameter editing, get the parameter definition
      const paramDefResult = await this.parameterEditor.getParameterDefinition(param);
      if (!paramDefResult.success || !paramDefResult.data) {
        await ctx.reply('❌ Parameter definition not found');
        return;
      }

      const paramDef = paramDefResult.data;
      const currentValue = ctx.session.deploymentConfigEdit.parameters?.[param] || '';
      
      ctx.session.awaitingConfigParam = param;
      
      const message = `⚙️ *Edit Parameter: ${paramDef.parameter_name}*

📝 *Description:* ${paramDef.description}
📊 *Type:* ${paramDef.data_type}
${paramDef.default_value ? `🔧 *Default:* ${paramDef.default_value}` : ''}
${currentValue ? `💾 *Current:* ${currentValue}` : ''}

Enter new value for *${paramDef.parameter_name}*:`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error handling edit param:', error);
      await ctx.reply('❌ Failed to edit parameter');
    }
  }

  static async handleParamInput(ctx: BotContext) {
    try {
      const param = ctx.session.awaitingConfigParam;
      if (!param || !ctx.session.deploymentConfigEdit) {
        await ctx.reply('❌ No parameter to edit');
        return;
      }

      const newValue = (ctx.message as any)?.text || '';
      
      // Handle name parameter separately
      if (param === 'name') {
        ctx.session.deploymentConfigEdit.name = newValue;
        ctx.session.awaitingConfigParam = undefined;
        await this.showParameterCategories(ctx);
        return;
      }
      
      // Update the parameter in the configuration
      if (!ctx.session.deploymentConfigEdit.parameters) {
        ctx.session.deploymentConfigEdit.parameters = {};
      }
      ctx.session.deploymentConfigEdit.parameters[param] = newValue;
      
      ctx.session.awaitingConfigParam = undefined;

      // Update progress
      ctx.session.deploymentConfigProgress = this.getProgress(ctx.session.deploymentConfigEdit);

      // Find which category this parameter belongs to
      const categoryParams = this.parameterEditor.getParameterCategories();
      let currentCategory = '';
      
      for (const [category, params] of Object.entries(categoryParams)) {
        if (params.includes(param)) {
          currentCategory = category;
          break;
        }
      }

      // Return to the category view where the parameter was edited
      if (currentCategory) {
        await this.showCategoryParameters(ctx, currentCategory);
      } else {
        // Fallback to categories view
        await this.showParameterCategories(ctx);
      }
    } catch (error) {
      console.error('Error handling param input:', error);
      await ctx.reply('❌ Failed to update parameter');
    }
  }

  static async saveConfig(ctx: BotContext) {
    try {
      const userId = ctx.from?.id.toString();
      if (!userId || !ctx.session.deploymentConfigEdit) {
        await ctx.reply('❌ User or config not found');
        return;
      }

      const config = { ...ctx.session.deploymentConfigEdit, user_id: userId };
      const isNew = ctx.session.deploymentConfigMode === 'create';

      // Validate required fields
      if (!config.name || config.name.trim() === '') {
        await ctx.reply('❌ Name is required');
        return;
      }

      let result;
      if (isNew) {
        result = await this.service.createConfig(userId, config.name, config.parameters);
      } else {
        result = await this.service.updateConfig(config.id, config);
      }

      if (!result.success) {
        await ctx.reply('❌ Failed to save configuration');
        return;
      }

      ctx.session.deploymentConfigEdit = undefined;
      ctx.session.deploymentConfigMode = undefined;
      ctx.session.deploymentConfigProgress = undefined;
      await ctx.reply('✅ Configuration saved successfully');
      await this.listConfigs(ctx);
    } catch (error) {
      console.error('Error saving deployment config:', error);
      await ctx.reply('❌ Failed to save configuration');
    }
  }

  static async cancelEdit(ctx: BotContext) {
    try {
      ctx.session.deploymentConfigEdit = undefined;
      ctx.session.deploymentConfigMode = undefined;
      ctx.session.deploymentConfigProgress = undefined;
      const cancelMsg = await ctx.reply('❌ Configuration editing cancelled', {
        reply_markup: { inline_keyboard: [[{ text: '🗑️ Delete', callback_data: 'delete_msg' }]] }
      });
      await this.listConfigs(ctx);
    } catch (error) {
      console.error('Error cancelling edit:', error);
      const errorMsg = await ctx.reply('❌ Failed to cancel editing', {
        reply_markup: { inline_keyboard: [[{ text: '🗑️ Delete', callback_data: 'delete_msg' }]] }
      });
    }
  }

  /**
   * Show parameter categories for editing
   */
  static async showParameterCategories(ctx: BotContext) {
    try {
      if (!ctx.session.deploymentConfigEdit) {
        await ctx.reply('❌ No configuration being edited');
        return;
      }

      const parameters = Object.entries(ctx.session.deploymentConfigEdit.parameters || {}).map(([key, value]) => ({
        parameter_key: key,
        current_value: value
      }));

      const categories = this.parameterEditor.calculateCategoryStatus(parameters);
      
      const message = `⚙️ *Deployment Configuration Parameters*

📋 *Parameter Categories:*
Configure your token parameters by category for easier management.

🔧 *Configuration Status:*
• Basic Info: ${categories.basic.completed ? '✅' : '⏳'} (${categories.basic.count}/4)
• Tax Settings: ${categories.taxes.completed ? '✅' : '⏳'} (${categories.taxes.count}/5)  
• Trading Rules: ${categories.trading.completed ? '✅' : '⏳'} (${categories.trading.count}/3)
• Transaction Limits: ${categories.limits.completed ? '✅' : '⏳'} (${categories.limits.count}/4)
• Advanced: ${categories.advanced.completed ? '✅' : '⏳'} (${categories.advanced.count}/1)

*Select a category to configure:*`;

      const keyboard = this.getCategoryKeyboard(categories, ctx);

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
      console.error('Error showing parameter categories:', error);
      await ctx.reply('❌ Failed to load parameter categories');
    }
  }

  /**
   * Show parameters for a specific category
   */
  static async showCategoryParameters(ctx: BotContext, category: string) {
    try {
      if (!ctx.session.deploymentConfigEdit) {
        await ctx.reply('❌ No configuration being edited');
        return;
      }

      const categoryParams = this.parameterEditor.getCategoryParams(category);
      const parameters = categoryParams.map(key => ({
        parameter_key: key,
        current_value: ctx.session.deploymentConfigEdit.parameters[key] || ''
      }));

      const message = `⚙️ *${category.charAt(0).toUpperCase() + category.slice(1)} Parameters*

Select a parameter to edit:`;

      const keyboard = this.getCategoryParametersKeyboard(parameters, category, ctx);

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
      console.error('Error showing category parameters:', error);
      await ctx.reply('❌ Failed to load category parameters');
    }
  }

  /**
   * Get category keyboard
   */
  private static getCategoryKeyboard(categories: any, ctx: BotContext) {
    const configId = ctx.session.deploymentConfigEdit?.id || 'new';
    
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📋 Basic Info', callback_data: `dep_cfg_cat_basic_${configId}` },
            { text: '💰 Tax Settings', callback_data: `dep_cfg_cat_taxes_${configId}` }
          ],
          [
            { text: '📈 Trading Rules', callback_data: `dep_cfg_cat_trading_${configId}` },
            { text: '🚫 Limits', callback_data: `dep_cfg_cat_limits_${configId}` }
          ],
          [
            { text: '⚙️ Advanced', callback_data: `dep_cfg_cat_advanced_${configId}` }
          ],
          [
            { text: '📝 Name', callback_data: `dep_cfg_name_${configId}` }
          ],
          [
            { text: '💾 Save', callback_data: `dep_cfg_save_${configId}` },
            { text: '❌ Cancel', callback_data: `dep_cfg_cancel_${configId}` }
          ]
        ]
      }
    };
  }

  /**
   * Get category parameters keyboard
   */
  private static getCategoryParametersKeyboard(parameters: any[], category: string, ctx: BotContext) {
    const configId = ctx.session.deploymentConfigEdit?.id || 'new';
    const buttons = [];

    for (let i = 0; i < parameters.length; i += 2) {
      const row = [];
      for (let j = 0; j < 2 && i + j < parameters.length; j++) {
        const param = parameters[i + j];
        const status = param.current_value ? '✅' : '⏳';
        row.push({
          text: `${status} ${this.parameterEditor.getShortParamName(param.parameter_key)}`,
          callback_data: `dep_cfg_param_${param.parameter_key}_${configId}`
        });
      }
      buttons.push(row);
    }

    buttons.push([
      { text: '🔙 Back to Categories', callback_data: `dep_cfg_categories_${configId}` }
    ]);

    return {
      reply_markup: {
        inline_keyboard: buttons
      }
    };
  }

  private static clearOtherConfigSessions(ctx: BotContext) {
    // Clear other config session states to prevent conflicts
    ctx.session.liquidityConfigEdit = undefined;
    ctx.session.liquidityConfigMode = undefined;
    ctx.session.liquidityConfigProgress = undefined;
    ctx.session.bundleConfigEdit = undefined;
    ctx.session.bundleConfigMode = undefined;
    ctx.session.bundleConfigProgress = undefined;
    ctx.session.configEdit = undefined; // Clear old config handler state
    ctx.session.awaitingConfigParam = undefined;
  }
} 