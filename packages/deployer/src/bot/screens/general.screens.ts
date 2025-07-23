import { ScreenContent } from './types';
import { web3Provider } from '../../web3/provider';

export class GeneralScreens {
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
3️⃣ Select deployment wallet
4️⃣ Review & deploy

*Required Information:*
• Token name (e.g., "My Awesome Token")
• Symbol (e.g., "MAT")
• Total supply (e.g., 1000000)
• Wallet for deployment`,
            footer: "Click 'Start Deployment' to begin 👇"
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
} 