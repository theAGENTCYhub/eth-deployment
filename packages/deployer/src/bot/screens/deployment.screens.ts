import { ScreenContent } from './types';

// Utility to escape Markdown special characters
function escapeMarkdown(text: string): string {
    if (!text) return '';
    return text
        .replace(/([_\*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export class DeploymentScreens {
    static getTemplateSelectionScreen(templates: any[]): ScreenContent {
        return {
            title: "📋 Select Contract Template",
            description: `
*Choose a contract template to deploy:*

${templates.map((template, index) => 
  `${index + 1}. **${template.name}**\n   ${template.description || 'No description available'}`
).join('\n\n')}

*What happens next:*
✅ Select a template
✅ Configure parameters
✅ Review and deploy`,
            footer: "Select a template to continue 👇"
        };
    }

    static getWalletSelectionScreen(wallets: any[]): ScreenContent {
        return {
            title: '💼 Select Wallet',
            description: 'Choose the wallet you want to use for deployment.\n\n' +
              wallets.map((w: any, i: number) => `*${i + 1}.* \`${w.address}\` (${w.name || 'No nickname'})`).join('\n'),
            footer: 'Select a wallet below:'
        };
    }

    static getCompilationProgressScreen(): ScreenContent {
        return {
            title: "🛠️ Compiling Contract...",
            description: `
*Compilation in Progress*

🔄 Sending contract to compiler...
🔄 Waiting for result...

This may take a few moments. Please wait...`,
            footer: "Do not close this window ⏳"
        };
    }

    static getCompilationSuccessScreen(): ScreenContent {
        return {
            title: "✅ Compilation Successful!",
            description: `
*Your contract was compiled successfully!*

• ABI and bytecode are ready.
• You can now proceed to deploy your contract to the blockchain.
`,
            footer: "Click 'Deploy' to continue."
        };
    }

    static getDeploymentSuccessScreen(deploymentResult: any): ScreenContent {
        return {
            title: "✅ Deployment Successful!",
            description: `
*Your contract has been deployed successfully!*

🏷️ **Contract Address:** 
\`${deploymentResult.contractAddress}\`

📋 **Transaction Hash:** 
\`${deploymentResult.transactionHash}\``,
            footer: "Click 'Home' to return to the main menu"
        };
    }

    static getDeploymentErrorScreen(errorMessage: string): ScreenContent {
        // Wrap error message in triple backticks to avoid Telegram Markdown parse errors
        const safeError = `\`\`\`\n${errorMessage}\`\`\``;
        return {
            title: "❌ Deployment Failed",
            description: `\n*Deployment was unsuccessful*\n\n**Error:** ${safeError}\n\n*Possible solutions:*\n• Check your network connection\n• Ensure sufficient ETH for gas\n• Try again in a few moments`,
            footer: "Click 'Try Again' to retry deployment"
        };
    }
} 