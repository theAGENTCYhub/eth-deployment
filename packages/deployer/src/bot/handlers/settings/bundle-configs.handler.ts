import { Markup } from 'telegraf';
import { BundleConfigurationService } from '../../../services/bundle-configuration.service';
import { DeployerWalletService } from '../../../services/wallet.service';
import { BotContext } from '../../types';
import { BundleConfigsScreens } from '../../screens/settings/bundle-configs.screens';
import { BundleConfigsKeyboards } from '../../keyboards/settings/bundle-configs.keyboards';

export class BundleConfigsHandler {
  private static service = new BundleConfigurationService();
  private static walletService = new DeployerWalletService();

  static async listConfigs(ctx: BotContext) {
    try {
      const userId = ctx.from?.id.toString();
      if (!userId) {
        await ctx.reply('❌ User ID not found');
        return;
      }

      const result = await this.service.getConfigsByUser(userId);
      if (!result.success || !result.data) {
        await ctx.reply('❌ Failed to load bundle configurations');
        return;
      }

      const configs = result.data || [];
      const message = BundleConfigsScreens.listConfigs(configs);
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('➕ New Configuration', 'bundle_cfg_new')],
        ...configs.map((config: any, index: number) => [
          Markup.button.callback(`${index + 1}. ${config.name}`, `bundle_cfg_view_${config.id}`)
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
      console.error('Error listing bundle configs:', error);
      await ctx.reply('❌ Failed to load bundle configurations');
    }
  }

  static async createConfig(ctx: BotContext) {
    try {
      console.log('Creating bundle config...');
      const userId = ctx.from?.id.toString();
      if (!userId) {
        const errorMsg = await ctx.reply('❌ User ID not found', {
          reply_markup: { inline_keyboard: [[{ text: '🗑️ Delete', callback_data: 'delete_msg' }]] }
        });
        return;
      }

      // Initialize default config
      const defaultConfig = {
        name: '',
        bundle_type: 'percentage',
        bundle_wallet_count: 0,
        total_supply_percentage: 0,
        funding_wallet_id: ''
      };

      ctx.session.bundleConfigEdit = { ...defaultConfig };
      ctx.session.bundleConfigMode = 'create';
      ctx.session.bundleConfigProgress = {};

      const message = this.getEditScreenMessage(ctx.session.bundleConfigEdit, true);
      const keyboard = this.getEditKeyboard(ctx.session.bundleConfigEdit, true);

      console.log('Sending bundle config creation screen...');

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
      console.error('Error creating bundle config:', error);
      const errorMsg = await ctx.reply('❌ Failed to create bundle configuration', {
        reply_markup: { inline_keyboard: [[{ text: '🗑️ Delete', callback_data: 'delete_msg' }]] }
      });
    }
  }

  private static getEditScreenMessage(config: any, isNew: boolean = false): string {
    const progress = this.getProgress(config);
    const progressText = Object.values(progress).filter(Boolean).length > 0 
      ? `\n\n📊 **Progress:** ${Object.values(progress).filter(Boolean).length}/5 fields completed`
      : '';

    const title = isNew ? '🆕 **Create New Bundle Configuration**' : `✏️ **Edit Configuration: ${config.name}**`;

    return `${title}${progressText}

📝 **Name:** ${config.name || 'Not set'} (required)
📦 **Type:** ${config.bundle_type || 'percentage'} (optional)
👥 **Wallet Count:** ${config.bundle_wallet_count || 'Not set'} (optional)
📊 **Supply %:** ${config.total_supply_percentage || 'Not set'} (optional)
💰 **Funding Wallet:** ${config.funding_wallet_id || 'Not set'} (optional)

Click a button below to edit a field, then click Save when done.`;
  }

  private static getProgress(config: any): any {
    return {
      name: !!config.name,
      bundle_type: !!config.bundle_type,
      bundle_wallet_count: config.bundle_wallet_count > 0,
      total_supply_percentage: config.total_supply_percentage > 0,
      funding_wallet_id: !!config.funding_wallet_id
    };
  }

  private static getEditKeyboard(config: any, isNew: boolean = false) {
    const progress = this.getProgress(config);
    const configId = config.id || 'new';
    
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: `${progress.name ? '✅' : '📝'} Name`, callback_data: `bundle_cfg_name_${configId}` },
            { text: `${progress.bundle_type ? '✅' : '📦'} Type`, callback_data: `bundle_cfg_type_${configId}` }
          ],
          [
            { text: `${progress.bundle_wallet_count ? '✅' : '👥'} Wallets`, callback_data: `bundle_cfg_wallets_${configId}` },
            { text: `${progress.total_supply_percentage ? '✅' : '📊'} Supply %`, callback_data: `bundle_cfg_supply_${configId}` }
          ],
          [
            { text: `${progress.funding_wallet_id ? '✅' : '💰'} Funding`, callback_data: `bundle_cfg_funding_${configId}` }
          ],
          [
            { text: isNew ? '💾 Create' : '💾 Save', callback_data: `bundle_cfg_save_${configId}` },
            { text: '❌ Cancel', callback_data: `bundle_cfg_cancel_${configId}` }
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
      const message = BundleConfigsScreens.viewConfig(config);
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Edit', `bundle_cfg_edit_${configId}`)],
        [Markup.button.callback('🗑️ Delete', `bundle_cfg_delete_${configId}`)],
        [Markup.button.callback('🔙 Back to List', 'bundle_cfg_list')]
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
      console.error('Error viewing bundle config:', error);
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

      ctx.session.bundleConfigEdit = { ...result.data };
      ctx.session.bundleConfigMode = 'edit';
      ctx.session.bundleConfigProgress = this.getProgress(result.data);

      const message = this.getEditScreenMessage(result.data, false);
      const keyboard = this.getEditKeyboard(result.data, false);

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
      console.error('Error editing bundle config:', error);
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

      await ctx.reply('✅ Bundle configuration deleted successfully');
      await this.listConfigs(ctx);
    } catch (error) {
      console.error('Error deleting bundle config:', error);
      await ctx.reply('❌ Failed to delete configuration');
    }
  }

  static async handleEditParam(ctx: BotContext, param: string) {
    try {
      if (!ctx.session.bundleConfigEdit) {
        await ctx.reply('❌ No configuration being edited');
        return;
      }

      // Special handling for wallet selection
      if (param === 'funding_wallet_id') {
        await this.showWalletSelection(ctx);
        return;
      }

      ctx.session.awaitingConfigParam = param;
      const fieldNames: { [key: string]: string } = {
        'name': 'Name',
        'bundle_type': 'Bundle Type',
        'bundle_wallet_count': 'Wallet Count',
        'total_supply_percentage': 'Supply Percentage',
        'funding_wallet_id': 'Funding Wallet'
      };
      
      await ctx.reply(`Enter new value for *${fieldNames[param] || param}*:`, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error handling edit param:', error);
      await ctx.reply('❌ Failed to edit parameter');
    }
  }

  static async showWalletSelection(ctx: BotContext) {
    try {
      const userId = ctx.from?.id.toString();
      if (!userId) {
        await ctx.reply('❌ User ID not found');
        return;
      }

      const result = await this.walletService.getWalletsByUser(userId);
      if (!result.success || !result.data) {
        await ctx.reply('❌ No wallets found. Please create a wallet first.');
        return;
      }

      const wallets = result.data;
      if (wallets.length === 0) {
        await ctx.reply('❌ No wallets found. Please create a wallet first.');
        return;
      }

      const message = `💰 **Select Funding Wallet**

Available wallets:`;
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            ...wallets.map((wallet: any, index: number) => [
              { text: `${index + 1}. ${wallet.name || wallet.address}`, callback_data: `bundle_cfg_select_wallet_${wallet.id}` }
            ]),
            [{ text: '❌ Cancel', callback_data: 'bundle_cfg_cancel' }]
          ]
        }
      };

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
    } catch (error) {
      console.error('Error showing wallet selection:', error);
      await ctx.reply('❌ Failed to load wallets');
    }
  }

  static async handleParamInput(ctx: BotContext) {
    try {
      const param = ctx.session.awaitingConfigParam;
      if (!param || !ctx.session.bundleConfigEdit) {
        await ctx.reply('❌ No parameter to edit');
        return;
      }

      const newValue = (ctx.message as any)?.text || '';
      
      // Handle numeric fields
      if (param === 'bundle_wallet_count' || param === 'total_supply_percentage') {
        const numValue = parseInt(newValue);
        if (isNaN(numValue) || numValue < 0) {
          await ctx.reply('❌ Please enter a valid positive number');
          return;
        }
        ctx.session.bundleConfigEdit[param] = numValue;
      } else {
        ctx.session.bundleConfigEdit[param] = newValue;
      }
      
      ctx.session.awaitingConfigParam = undefined;

      // Update progress
      ctx.session.bundleConfigProgress = this.getProgress(ctx.session.bundleConfigEdit);

      const message = this.getEditScreenMessage(ctx.session.bundleConfigEdit, ctx.session.bundleConfigMode === 'create');
      const keyboard = this.getEditKeyboard(ctx.session.bundleConfigEdit, ctx.session.bundleConfigMode === 'create');

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
    } catch (error) {
      console.error('Error handling param input:', error);
      await ctx.reply('❌ Failed to update parameter');
    }
  }

  static async saveConfig(ctx: BotContext) {
    try {
      const userId = ctx.from?.id.toString();
      if (!userId || !ctx.session.bundleConfigEdit) {
        await ctx.reply('❌ User or config not found');
        return;
      }

      const config = { ...ctx.session.bundleConfigEdit, user_id: userId };
      const isNew = ctx.session.bundleConfigMode === 'create';

      // Validate required fields
      if (!config.name || config.name.trim() === '') {
        await ctx.reply('❌ Name is required');
        return;
      }

      let result;
      if (isNew) {
        console.log('Creating bundle config with data:', {
          userId,
          name: config.name,
          bundle_type: config.bundle_type,
          bundle_wallet_count: config.bundle_wallet_count,
          total_supply_percentage: config.total_supply_percentage,
          funding_wallet_id: config.funding_wallet_id
        });
        
        result = await this.service.createConfig(userId, config.name, config.bundle_type, config.bundle_wallet_count, config.total_supply_percentage, config.funding_wallet_id);
      } else {
        console.log('Updating bundle config with data:', {
          configId: config.id,
          name: config.name,
          bundle_type: config.bundle_type,
          bundle_wallet_count: config.bundle_wallet_count,
          total_supply_percentage: config.total_supply_percentage,
          funding_wallet_id: config.funding_wallet_id
        });
        
        result = await this.service.updateConfig(config.id, config);
      }

      if (!result.success) {
        console.error('Failed to save bundle config:', result.error);
        const errorMsg = await ctx.reply(`❌ Failed to save configuration: ${result.error}`, {
          reply_markup: { inline_keyboard: [[{ text: '🗑️ Delete', callback_data: 'delete_msg' }]] }
        });
        return;
      }

      ctx.session.bundleConfigEdit = undefined;
      ctx.session.bundleConfigMode = undefined;
      ctx.session.bundleConfigProgress = undefined;
      await ctx.reply('✅ Configuration saved successfully');
      await this.listConfigs(ctx);
    } catch (error) {
      console.error('Error saving bundle config:', error);
      await ctx.reply('❌ Failed to save configuration');
    }
  }

  static async cancelEdit(ctx: BotContext) {
    try {
      ctx.session.bundleConfigEdit = undefined;
      ctx.session.bundleConfigMode = undefined;
      ctx.session.bundleConfigProgress = undefined;
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

  static async selectWallet(ctx: BotContext, walletId: string) {
    try {
      if (!ctx.session.bundleConfigEdit) {
        await ctx.reply('❌ No configuration being edited');
        return;
      }

      ctx.session.bundleConfigEdit.funding_wallet_id = walletId;
      ctx.session.bundleConfigProgress = this.getProgress(ctx.session.bundleConfigEdit);

      const message = this.getEditScreenMessage(ctx.session.bundleConfigEdit, ctx.session.bundleConfigMode === 'create');
      const keyboard = this.getEditKeyboard(ctx.session.bundleConfigEdit, ctx.session.bundleConfigMode === 'create');

      await ctx.reply('✅ Wallet selected successfully!', {
        parse_mode: 'Markdown'
      });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
    } catch (error) {
      console.error('Error selecting wallet:', error);
      await ctx.reply('❌ Failed to select wallet');
    }
  }

  private static clearOtherConfigSessions(ctx: BotContext) {
    // Clear other config session states to prevent conflicts
    ctx.session.deploymentConfigEdit = undefined;
    ctx.session.deploymentConfigMode = undefined;
    ctx.session.deploymentConfigProgress = undefined;
    ctx.session.liquidityConfigEdit = undefined;
    ctx.session.liquidityConfigMode = undefined;
    ctx.session.liquidityConfigProgress = undefined;
    ctx.session.configEdit = undefined; // Clear old config handler state
    ctx.session.awaitingConfigParam = undefined;
  }
} 