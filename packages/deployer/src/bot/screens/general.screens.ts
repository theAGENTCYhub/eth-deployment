import { ScreenContent } from './types';
import { web3Provider } from '../../web3/provider';

export class GeneralScreens {
    static getHomeScreen(userName?: string): ScreenContent {
        const networkStatus = web3Provider.getNetworkStatus();
        const isTestnet = web3Provider.isTestnet();
        const testnetWarning = isTestnet ? "\n⚠️ *Running on testnet - Safe for testing*" : "\n🔴 *MAINNET MODE - USE WITH CAUTION*";

        return {
            title: "🏠 ETH Token Deployer",
            description: `
*Welcome back${userName ? `, ${userName}` : ''}! Ready to deploy and launch tokens?*

Your one-stop solution for ERC20 token deployment and launch management.

${networkStatus}${testnetWarning}

**Quick Actions:**
• 🎯 View and manage all your launches
• 🚀 Deploy new ERC20 tokens with custom parameters
• 💼 Manage your wallets and private keys
• 📋 View deployed contracts and templates
• ⚙️ Configure deployment and launch settings
• 📊 Check network status and balances

*Choose an action below to get started:*`,
            footer: "Select an action to continue"
        };
    }

    static getWelcomeScreen(): ScreenContent {
        const networkStatus = web3Provider.getNetworkStatus();
        const isTestnet = web3Provider.isTestnet();
        const testnetWarning = isTestnet ? "\n⚠️ *Running on testnet - Safe for testing*" : "\n🔴 *MAINNET MODE - USE WITH CAUTION*";

        return {
            title: "🏠 ETH Token Deployer",
            description: `
*Welcome to ETH Token Deployer!*

Deploy, launch, and manage ERC20 tokens with ease.

${networkStatus}${testnetWarning}

**Features:**
• 🚀 Deploy custom ERC20 tokens
• 💧 Create liquidity pools
• 📊 Manage launches and positions
• 💰 Execute trades across multiple wallets
• 💼 Secure wallet management
• 📋 Contract template library
• ⚙️ Advanced configuration options

*Ready to get started?*`,
            footer: "Choose your first action"
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