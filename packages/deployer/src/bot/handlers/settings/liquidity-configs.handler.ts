import { Markup } from 'telegraf';
import { LiquidityConfigurationService } from '../../../services/liquidity-configuration.service';
import { DeployerWalletService } from '../../../services/wallet.service';
import { BotContext } from '../../types';
import { LiquidityConfigsScreens } from '../../screens/settings/liquidity-configs.screens';
import { LiquidityConfigsKeyboards } from '../../keyboards/settings/liquidity-configs.keyboards';

export class LiquidityConfigsHandler {
  private static service = new LiquidityConfigurationService();
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
        await ctx.reply('❌ Failed to load liquidity configurations');
        return;
      }

      const configs = result.data || [];
      const message = LiquidityConfigsScreens.listConfigs(configs);
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('➕ New Configuration', 'liq_cfg_new')],
        ...configs.map((config: any, index: number) => [
          Markup.button.callback(`${index + 1}. ${config.name}`, `liq_cfg_view_${config.id}`)
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
      console.error('Error listing liquidity configs:', error);
      await ctx.reply('❌ Failed to load liquidity configurations');
    }
  }

  static async createConfig(ctx: BotContext) {
    try {
      const userId = ctx.from?.id.toString();
      if (!userId) {
        await ctx.reply('❌ User ID not found');
        return;
      }

      // Initialize default config
      const defaultConfig = {
        name: '',
        initial_liquidity_eth: '',
        liquidity_wallet_id: ''
      };

      ctx.session.liquidityConfigEdit = { ...defaultConfig };
      ctx.session.liquidityConfigMode = 'create';
      ctx.session.liquidityConfigProgress = {};

      const message = this.getEditScreenMessage(ctx.session.liquidityConfigEdit, true);
      const keyboard = this.getEditKeyboard(ctx.session.liquidityConfigEdit, true);

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
      console.error('Error creating liquidity config:', error);
      await ctx.reply('❌ Failed to create liquidity configuration');
    }
  }

  static async viewConfig(ctx: BotContext, configId: string) {
    try {
      const result = await this.service.getConfigById(configId);
      if (!result.success || !result.data) {
        await ctx.reply('❌ Configuration not found');
        return;
      }

      const config = result.data;
      const message = LiquidityConfigsScreens.viewConfig(config);
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Edit', `liq_cfg_edit_${configId}`)],
        [Markup.button.callback('🗑️ Delete', `liq_cfg_delete_${configId}`)],
        [Markup.button.callback('🔙 Back to List', 'liq_cfg_list')]
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
      console.error('Error viewing liquidity config:', error);
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

      ctx.session.liquidityConfigEdit = { ...result.data };
      ctx.session.liquidityConfigMode = 'edit';
      ctx.session.liquidityConfigProgress = this.getProgress(result.data);

      const message = this.getEditScreenMessage(ctx.session.liquidityConfigEdit, false);
      const keyboard = this.getEditKeyboard(ctx.session.liquidityConfigEdit, false);

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
      console.error('Error editing liquidity config:', error);
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

      await ctx.reply('✅ Liquidity configuration deleted successfully');
      await this.listConfigs(ctx);
    } catch (error) {
      console.error('Error deleting liquidity config:', error);
      await ctx.reply('❌ Failed to delete configuration');
    }
  }

  static async handleEditParam(ctx: BotContext, param: string) {
    try {
      ctx.session.awaitingConfigParam = param;
      await ctx.reply(`Enter new value for *${param.replace(/_/g, ' ')}*:`, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error handling edit param:', error);
      await ctx.reply('❌ Failed to edit parameter');
    }
  }

  static async handleParamInput(ctx: BotContext) {
    try {
      const param = ctx.session.awaitingConfigParam;
      if (!param || !ctx.session.liquidityConfigEdit) {
        await ctx.reply('❌ No parameter to edit');
        return;
      }

      const newValue = (ctx.message as any)?.text || '';
      ctx.session.liquidityConfigEdit[param] = newValue;
      ctx.session.awaitingConfigParam = undefined;

      // Update progress
      ctx.session.liquidityConfigProgress = this.getProgress(ctx.session.liquidityConfigEdit);

      const message = this.getEditScreenMessage(ctx.session.liquidityConfigEdit, ctx.session.liquidityConfigMode === 'create');
      const keyboard = this.getEditKeyboard(ctx.session.liquidityConfigEdit, ctx.session.liquidityConfigMode === 'create');

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
      if (!userId || !ctx.session.liquidityConfigEdit) {
        await ctx.reply('❌ User or config not found');
        return;
      }

      const config = { ...ctx.session.liquidityConfigEdit, user_id: userId };
      const isNew = ctx.session.liquidityConfigMode === 'create';

      let result;
      if (isNew) {
        result = await this.service.createConfig(userId, config.name, config.initial_liquidity_eth, config.liquidity_wallet_id);
      } else {
        result = await this.service.updateConfig(config.id, config);
      }

      if (!result.success) {
        await ctx.reply('❌ Failed to save configuration');
        return;
      }

      ctx.session.liquidityConfigEdit = undefined;
      ctx.session.liquidityConfigMode = undefined;
      ctx.session.liquidityConfigProgress = undefined;
      await ctx.reply('✅ Configuration saved successfully');
      await this.listConfigs(ctx);
    } catch (error) {
      console.error('Error saving liquidity config:', error);
      await ctx.reply('❌ Failed to save configuration');
    }
  }

  static async cancelEdit(ctx: BotContext) {
    try {
      ctx.session.liquidityConfigEdit = undefined;
      ctx.session.liquidityConfigMode = undefined;
      ctx.session.liquidityConfigProgress = undefined;
      await ctx.reply('❌ Configuration editing cancelled');
      await this.listConfigs(ctx);
    } catch (error) {
      console.error('Error cancelling edit:', error);
      await ctx.reply('❌ Failed to cancel editing');
    }
  }

  private static getEditScreenMessage(config: any, isNew: boolean = false): string {
    const progress = this.getProgress(config);
    const progressText = Object.values(progress).filter(Boolean).length > 0 
      ? `\n\n📊 **Progress:** ${Object.values(progress).filter(Boolean).length}/3 fields completed`
      : '';

    const title = isNew ? '🆕 **Create New Liquidity Configuration**' : `✏️ **Edit Configuration: ${config.name}**`;

    return `${title}${progressText}

📝 **Name:** ${config.name || 'Not set'} (required)
💰 **ETH Amount:** ${config.initial_liquidity_eth || 'Not set'} (optional)
👛 **Wallet:** ${config.liquidity_wallet_id || 'Not set'} (optional)

Click a button below to edit a field, then click Save when done.`;
  }

  private static getProgress(config: any): any {
    return {
      name: !!config.name,
      initial_liquidity_eth: !!config.initial_liquidity_eth,
      liquidity_wallet_id: !!config.liquidity_wallet_id
    };
  }

  private static getEditKeyboard(config: any, isNew: boolean = false) {
    const progress = this.getProgress(config);
    const configId = config.id || 'new';
    
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: `${progress.name ? '✅' : '📝'} Name`, callback_data: `liq_cfg_name_${configId}` },
            { text: `${progress.initial_liquidity_eth ? '✅' : '💰'} ETH Amount`, callback_data: `liq_cfg_eth_${configId}` }
          ],
          [
            { text: `${progress.liquidity_wallet_id ? '✅' : '👛'} Wallet`, callback_data: `liq_cfg_wallet_${configId}` }
          ],
          [
            { text: isNew ? '💾 Create' : '💾 Save', callback_data: `liq_cfg_save_${configId}` },
            { text: '❌ Cancel', callback_data: `liq_cfg_cancel_${configId}` }
          ]
        ]
      }
    };
  }

  private static clearOtherConfigSessions(ctx: BotContext) {
    // Clear other config session states to prevent conflicts
    ctx.session.deploymentConfigEdit = undefined;
    ctx.session.deploymentConfigMode = undefined;
    ctx.session.deploymentConfigProgress = undefined;
    ctx.session.bundleConfigEdit = undefined;
    ctx.session.bundleConfigMode = undefined;
    ctx.session.bundleConfigProgress = undefined;
    ctx.session.configEdit = undefined; // Clear old config handler state
    ctx.session.awaitingConfigParam = undefined;
  }
} 