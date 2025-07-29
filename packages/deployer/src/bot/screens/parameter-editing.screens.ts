import { ScreenContent } from './types';

// Utility to escape Markdown special characters
function escapeMarkdown(text: string): string {
    if (!text) return '';
    return text
        .replace(/([_\*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export class ParameterEditingScreens {
    static getParameterEditingScreen(templateName: string, parameters: string[], currentValues: Record<string, string> = {}, selectedWalletId?: string, walletInfo?: string): ScreenContent {
        const configuredCount = Object.keys(currentValues).length;
        const walletStatus = selectedWalletId ? `✅ Wallet selected` : `❌ No wallet selected`;
        
        let description = `\n*Template: ${escapeMarkdown(templateName)}*\n\nFound **${parameters.length}** parameters to configure.\n\n*How to configure:*\n📝 Click on any parameter button below to edit its value.\n✅ Use "Confirm All" when you're done.\n🔄 Use "Reset All" to clear all values.\n\n*Current Progress:*\n• Configured: ${configuredCount}/${parameters.length} parameters\n• Wallet: ${walletStatus}`;
        
        if (walletInfo) {
            description += `\n\n${walletInfo}`;
        }
        
        return {
            title: `⚙️ Configure ${escapeMarkdown(templateName)}`,
            description: description,
            footer: selectedWalletId ? "All set! Click 'Confirm All' to proceed 👇" : "Configure parameters and select a wallet 👇"
        };
    }

    static getSingleParameterScreen(parameter: string, type: string, description: string, currentValue: string, isRequired: boolean): ScreenContent {
        const required = isRequired ? ' (Required)' : '';
        
        return {
            title: `⚙️ Edit Parameter: ${escapeMarkdown(parameter)}`,
            description: `\n*Parameter Details:*\n• **Name:** ${escapeMarkdown(parameter)}${required}\n• **Type:** ${escapeMarkdown(type)}\n• **Description:** ${escapeMarkdown(description)}\n• **Current Value:** ${escapeMarkdown(currentValue) || 'Not set'}\n\n*How to set value:*\n📝 Reply with the new value for this parameter.\n\n*Examples:*\n${type === 'string' ? '• "My Token Name"' : ''}\n${type === 'number' ? '• 1000000' : ''}\n${type === 'address' ? '• 0x1234567890123456789012345678901234567890' : ''}\n${type === 'boolean' ? '• true or false' : ''}`,
            footer: "Reply with the new value below 👇"
        };
    }

    static getParameterConfirmationScreen(templateName: string, parameterValues: Record<string, string>, modifiedSource: string, network: string): ScreenContent {
        return {
            title: `✅ Parameter Configuration Complete`,
            description: `\n*Template: ${escapeMarkdown(templateName)}*\n\n**Configured Parameters:**\n${Object.entries(parameterValues).map(([key, value]) => 
                `• **${escapeMarkdown(key)}**: \`${escapeMarkdown(value)}\``
            ).join('\n')}\n\n**Preview (first few lines):**\n\`\`\`\n${escapeMarkdown(modifiedSource.split('\n').slice(0, 10).join('\n'))}\n\`\`\`\n\n*Ready to deploy?*\n✅ Parameters validated\n✅ Contract source ready\n✅ Network: ${escapeMarkdown(network)}`,
            footer: "Review the configuration and click 'Deploy Contract' ��"
        };
    }

    static categoryMenu(instanceId: string, categories: any, devWalletInfo?: string): string {
      return `⚙️ *Contract Configuration*

📋 *Parameter Categories:*
Configure your token parameters by category for easier management.

🔧 *Configuration Status:*
• Basic Info: ${categories.basic.completed ? '✅' : '⏳'} (${categories.basic.count}/4)
• Tax Settings: ${categories.taxes.completed ? '✅' : '⏳'} (${categories.taxes.count}/5)  
• Trading Rules: ${categories.trading.completed ? '✅' : '⏳'} (${categories.trading.count}/3)
• Transaction Limits: ${categories.limits.completed ? '✅' : '⏳'} (${categories.limits.count}/4)
• Advanced: ${categories.advanced.completed ? '✅' : '⏳'} (${categories.advanced.count}/1)
${devWalletInfo ? `• Developer Wallet: ${devWalletInfo}` : ''}

*Select a category to configure:*`;
    }
} 