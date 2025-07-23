import { ScreenContent } from './types';

// Utility to escape Markdown special characters
function escapeMarkdown(text: string): string {
    if (!text) return '';
    return text
        .replace(/([_\*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export class WalletScreens {
    static getWalletMainScreen(walletCount: number): ScreenContent {
        return {
            title: '💼 Wallet Management',
            description: `You currently have *${walletCount}* wallets.\n\nWhat would you like to do?`,
            footer: 'Choose an option below:'
        };
    }

    static getWalletListScreen(wallets: any[], page: number, totalPages: number): ScreenContent {
        return {
            title: '📒 Your Wallets',
            description: `Page *${page + 1}* of *${totalPages}*\n\n${wallets.map((w, i) => `*${i + 1}.* \`${w.address}\` (${w.name || 'No nickname'}) [${w.type}]`).join('\n') || 'No wallets found.'}`,
            footer: 'Select a wallet or navigate pages.'
        };
    }

    static getWalletDetailScreen(wallet: any): ScreenContent {
        return {
            title: '👛 Wallet Details',
            description: `*Address:* \`${wallet.address}\`\n*Nickname:* ${wallet.name || 'No nickname'}\n*Type:* ${wallet.type}\n*Created:* ${wallet.created_at ? wallet.created_at.split('T')[0] : ''}`,
            footer: 'Choose an action below:'
        };
    }
} 