// src/bot/screens/index.ts
import { web3Provider } from '../../web3/provider';

export interface ScreenContent {
    title: string;
    description: string;
    footer?: string;
}

// Utility to escape Markdown special characters
function escapeMarkdown(text: string): string {
    if (!text) return '';
    return text
        .replace(/([_\*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export class BotScreens {
    static getHomeScreen(): ScreenContent {
        const networkStatus = web3Provider.getNetworkStatus();
        const isTestnet = web3Provider.isTestnet();
        const testnetWarning = isTestnet ? "\n⚠️ *Running on testnet - Safe for testing*" : "\n🔴 *MAINNET MODE - USE WITH CAUTION*";

        return {
            title: "🚀 Welcome to ETH Token Deployer",
            description: `
Your one-stop solution for deploying ERC20 tokens on Ethereum!

${networkStatus}${testnetWarning}

*What you can do:*
• Deploy custom ERC20 tokens
• Manage contract templates
• Configure multi-wallet distributions
• Create liquidity pools

Ready to launch your next token?`,
            footer: "Select an option below to get started 👇"
        };
    }

    static getDeployScreen(): ScreenContent {
        const networkStatus = web3Provider.getNetworkStatus();

        return {
            title: "⚡ Deploy ERC20 Token",
            description: `
Let's deploy your ERC20 token!

${networkStatus}

*Deployment Process:*
1️⃣ Choose contract template
2️⃣ Configure token parameters
3️⃣ Set up wallet distribution
4️⃣ Review & deploy

*Required Information:*
• Token name (e.g., "My Awesome Token")
• Symbol (e.g., "MAT")
• Total supply (e.g., 1000000)
• Wallet for deployment`,
            footer: "Choose your deployment option 👇"
        };
    }

    static getErrorScreen(error: string): ScreenContent {
        return {
            title: "❌ Error",
            description: `
Something went wrong:

\`${error}\`

Please try again or contact support if the issue persists.`,
            footer: "Use /start to return to home"
        };
    }

    static getSuccessScreen(title: string, message: string): ScreenContent {
        return {
            title: `✅ ${title}`,
            description: message,
            footer: "Use /start to return to home"
        };
    }

    static getParameterEditingScreen(templateName: string, parameters: string[], currentValues: Record<string, string> = {}): ScreenContent {
        const configuredCount = Object.keys(currentValues).length;
        
        return {
            title: `⚙️ Configure ${escapeMarkdown(templateName)}`,
            description: `\n*Template: ${escapeMarkdown(templateName)}*\n\nFound **${parameters.length}** parameters to configure.\n\n*How to configure:*\n📝 Click on any parameter button below to edit its value.\n✅ Use "Confirm All" when you're done.\n🔄 Use "Reset All" to clear all values.\n\n*Current Progress:*\n• Configured: ${configuredCount}/${parameters.length} parameters`,
            footer: "Click on a parameter to edit it 👇"
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

    static formatScreen(screen: ScreenContent): string {
        let message = `*${screen.title}*\n\n${screen.description}`;

        if (screen.footer) {
            message += `\n\n${screen.footer}`;
        }

        return message;
    }
}