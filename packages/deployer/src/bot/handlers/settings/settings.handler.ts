import { Markup } from 'telegraf';
import { BotContext } from '../../types';

export class SettingsHandler {
  static async showSettings(ctx: BotContext) {
    try {
      const message = `⚙️ **Settings**

Choose a configuration type to manage:

📋 **Deployment Configurations** - Reusable contract parameter sets
💧 **Liquidity Configurations** - Liquidity pool creation settings  
📦 **Bundle Configurations** - Bundle coordination strategies

Select a configuration type below to get started.`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📋 Deployment Configs', 'settings_deployment_configs')],
        [Markup.button.callback('💧 Liquidity Configs', 'settings_liquidity_configs')],
        [Markup.button.callback('📦 Bundle Configs', 'settings_bundle_configs')],
        [Markup.button.callback('🔙 Back to Home', 'action_home')]
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
      console.error('Error showing settings:', error);
      await ctx.reply('❌ Failed to load settings');
    }
  }
} 