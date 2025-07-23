import { Markup } from 'telegraf';
import { CallbackManager } from '../callbacks';

// Utility to escape Markdown special characters
function escapeMarkdown(text: string): string {
    if (!text) return '';
    return text
        .replace(/([_\*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export class ParameterEditingKeyboards {
  // Parameter editing keyboard - shows all parameters as buttons
  static getParameterEditingKeyboard(templateId: string, parameters: string[], currentValues: Record<string, string> = {}) {
    const buttons = parameters.map((param) => {
      const value = currentValues[param];
      const displayValue = value ? `: ${escapeMarkdown(value)}` : '';
      return [Markup.button.callback(`⚙️ ${escapeMarkdown(param)}${displayValue}`, CallbackManager.generateParamCallback(templateId, param))];
    });
    // Add wallet selection button
    buttons.push([
      Markup.button.callback('Choose Wallet', 'choose_wallet')
    ]);
    // Add navigation buttons
    buttons.push([
      Markup.button.callback('✅ Confirm All', CallbackManager.generateConfirmCallback(templateId)),
      Markup.button.callback('🔄 Reset All', CallbackManager.generateResetCallback(templateId))
    ]);
    buttons.push([
      Markup.button.callback('🔙 Back to Templates', 'action_template_selection'),
      Markup.button.callback('❌ Abort', 'action_abort_deployment')
    ]);
    
    return Markup.inlineKeyboard(buttons);
  }

  // Single parameter editing keyboard
  static getSingleParameterKeyboard(templateId: string, parameter: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Back to Parameters', CallbackManager.generateBackToParamsCallback(templateId))],
      [Markup.button.callback('❌ Abort', 'action_abort_deployment')]
    ]);
  }
} 