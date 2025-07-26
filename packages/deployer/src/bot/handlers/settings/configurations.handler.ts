import { ConfigurationsScreens } from '../../screens/settings/configurations.screens';
import { ConfigurationsKeyboards } from '../../keyboards/settings/configurations.keyboards';
import { LaunchConfigsService } from '@eth-deployer/supabase';

const launchConfigsService = new LaunchConfigsService();

const DEFAULT_CONFIG = {
  name: '',
  bundle_wallet_count: 2,
  eth_per_wallet: '0',
  bundle_token_percent: 10,
  bundle_token_percent_per_wallet: 2,
  liquidity_eth_amount: '0',
  liquidity_token_percent: 50
};

export class ConfigurationsHandler {
  static async listConfigs(ctx: any) {
    const userId = ctx.from?.id?.toString();
    if (!userId) return ctx.reply('User not found.');
    const result = await launchConfigsService.getByUserId(userId);
    if (!result.success) return ctx.reply('Failed to load configurations.');
    await ctx.reply(
      ConfigurationsScreens.listConfigs(result.data || []),
      { parse_mode: 'Markdown', ...ConfigurationsKeyboards.listConfigs(result.data || []) }
    );
  }

  static async viewConfig(ctx: any, configId: string) {
    const result = await launchConfigsService.getById(configId);
    if (!result.success || !result.data) return ctx.reply('Configuration not found.');
    await ctx.reply(
      ConfigurationsScreens.viewConfig(result.data),
      { parse_mode: 'Markdown', ...ConfigurationsKeyboards.viewConfig(result.data) }
    );
  }

  static async createConfig(ctx: any) {
    ctx.session.configEdit = { ...DEFAULT_CONFIG };
    await ctx.reply(
      ConfigurationsScreens.createConfig(ctx.session.configEdit),
      { parse_mode: 'Markdown', ...ConfigurationsKeyboards.createConfig(ctx.session.configEdit) }
    );
  }

  static async editConfig(ctx: any, configId: string) {
    const result = await launchConfigsService.getById(configId);
    if (!result.success || !result.data) return ctx.reply('Configuration not found.');
    ctx.session.configEdit = { ...result.data };
    await ctx.reply(
      ConfigurationsScreens.editConfig(ctx.session.configEdit),
      { parse_mode: 'Markdown', ...ConfigurationsKeyboards.editConfig(ctx.session.configEdit) }
    );
  }

  static async handleEditParam(ctx: any, param: string) {
    // Prompt user for new value
    ctx.session.awaitingConfigParam = param;
    await ctx.reply(`Enter new value for *${param.replace(/_/g, ' ')}*:`, { parse_mode: 'Markdown' });
  }

  static async handleParamInput(ctx: any) {
    const param = ctx.session.awaitingConfigParam;
    if (!param || !ctx.session.configEdit) return ctx.reply('No parameter to edit.');
    ctx.session.configEdit[param] = ctx.message.text;
    ctx.session.awaitingConfigParam = null;
    await ctx.reply(
      ConfigurationsScreens.editConfig(ctx.session.configEdit),
      { parse_mode: 'Markdown', ...ConfigurationsKeyboards.editConfig(ctx.session.configEdit) }
    );
  }

  static async saveConfig(ctx: any, isNew: boolean) {
    const userId = ctx.from?.id?.toString();
    if (!userId || !ctx.session.configEdit) return ctx.reply('User or config not found.');
    const config = { ...ctx.session.configEdit, user_id: userId };
    let result;
    if (isNew) {
      result = await launchConfigsService.create(config);
    } else {
      result = await launchConfigsService.update(config.id, config);
    }
    if (!result.success) return ctx.reply('Failed to save configuration.');
    ctx.session.configEdit = null;
    await ctx.reply('✅ Configuration saved.');
    await this.listConfigs(ctx);
  }

  static async deleteConfig(ctx: any, configId: string) {
    const result = await launchConfigsService.delete(configId);
    if (!result.success) return ctx.reply('Failed to delete configuration.');
    await ctx.reply('🗑️ Configuration deleted.');
    await this.listConfigs(ctx);
  }
} 