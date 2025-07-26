import { BotContext } from '../../types';

export interface LaunchData {
  id: string;
  tokenName: string;
  tokenAddress: string;
  totalSupply: string;
  bundleWallets: number;
  liquidityPool: string;
  poolValue: string;
  positions: number;
  totalPnL: string;
  pnlPercentage: string;
  totalInvested?: string;
  currentValue?: string;
}

export class LaunchesScreens {
  /**
   * Get the main launches list screen
   */
  static getLaunchesListScreen(launches: LaunchData[] = [], totalLaunches: number = 0, activePositions: number = 0, totalValue: string = '0') {
    if (launches.length === 0) {
      return {
        title: "🚀 Active Launches",
        description: `
*You don't have any active token launches yet.*

To get started:
1. Deploy a token using "🚀 Deploy Token"
2. Create a bundle launch using "🎯 Bundle Launch"
3. Your launches will appear here for management

*Ready to launch your first token?*`,
        footer: "Use the buttons below to get started"
      };
    }

    const launchesList = launches.map((launch, index) => {
      const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
      return `${index + 1}. **${launch.tokenName}** (\`${shortAddress}\`)
   • Bundle Wallets: ${launch.bundleWallets}
   • Pool Value: ${launch.poolValue}
   • P&L: ${launch.totalPnL} (${launch.pnlPercentage})`;
    }).join('\n\n');

    return {
      title: "🚀 Active Launches",
      description: `
*You have ${totalLaunches} active token launches:*

📊 **Launch Overview:**
• Total Launches: ${totalLaunches}
• Active Positions: ${activePositions}
• Total Value: ${totalValue} ETH

*Select a launch to manage:*

${launchesList}`,
      footer: "Tap on a launch to view details and manage positions"
    };
  }

  /**
   * Get launch management screen
   */
  static getLaunchManagementScreen(launch: LaunchData) {
    const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
    
    return {
      title: "🎯 Launch Management",
      description: `
*Token: ${launch.tokenName}*

📊 **Launch Details:**
• Contract: \`${shortAddress}\`
• Total Supply: ${launch.totalSupply} tokens
• Bundle Wallets: ${launch.bundleWallets} wallets
• Liquidity Pool: ${launch.liquidityPool}

💰 **Current Status:**
• Pool Value: ${launch.poolValue} ETH
• Your Positions: ${launch.positions} positions
• Total P&L: ${launch.totalPnL} ETH (${launch.pnlPercentage})`,
      footer: "Choose an action below to manage this launch"
    };
  }

  /**
   * Get positions list screen
   */
  static getPositionsListScreen(launch: LaunchData, positions: any[] = [], currentPage: number = 1, totalPages: number = 1) {
    const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
    
    if (positions.length === 0) {
      return {
        title: "📈 Launch Positions",
        description: `
*Token: ${launch.tokenName} (\`${shortAddress}\`)*

💼 **Portfolio Overview:**
• Total Positions: 0
• Total Invested: 0 ETH
• Current Value: 0 ETH
• Total P&L: 0 ETH (0%)

*No positions found for this launch.*

You can create positions by:
1. Using the Management features
2. Trading tokens through the bot
3. Adding liquidity to the pool`,
        footer: "Use the back button to return to launch management"
      };
    }

    const positionsList = positions.map((position, index) => {
      const shortWallet = `${position.walletAddress.slice(0, 6)}...${position.walletAddress.slice(-4)}`;
      const pnlColor = position.pnl >= 0 ? '🟢' : '🔴';
      return `${index + 1}. **${shortWallet}**
   • Balance: ${position.tokenBalance} tokens
   • Value: ${position.currentValue} ETH
   • P&L: ${pnlColor} ${position.pnl} ETH (${position.pnlPercentage})`;
    }).join('\n\n');

    return {
      title: "📈 Launch Positions",
      description: `
*Token: ${launch.tokenName} (\`${shortAddress}\`)*

💼 **Portfolio Overview:**
• Total Positions: ${positions.length}
• Total Invested: ${launch.totalInvested || '0'} ETH
• Current Value: ${launch.currentValue || '0'} ETH
• Total P&L: ${launch.totalPnL} ETH (${launch.pnlPercentage})

*Positions (Page ${currentPage}/${totalPages}):*

${positionsList}`,
      footer: "Select a position to view details and trade"
    };
  }

  /**
   * Get position detail screen
   */
  static getPositionDetailScreen(position: any, mode: 'buy' | 'sell' = 'buy') {
    const shortWallet = `${position.walletAddress.slice(0, 6)}...${position.walletAddress.slice(-4)}`;
    const pnlColor = position.pnl >= 0 ? '🟢' : '🔴';
    
    return {
      title: "💰 Position Details",
      description: `
*Wallet: ${shortWallet}*

📊 **Position Info:**
• Token Balance: ${position.tokenBalance} tokens
• Entry Value: ${position.entryValue} ETH
• Current Value: ${position.currentValue} ETH
• P&L: ${pnlColor} ${position.pnl} ETH (${position.pnlPercentage})

*Current Mode: ${mode.toUpperCase()}*

${mode === 'buy' ? 
  '💵 **Buy Options:**\nSelect an amount to buy more tokens:' :
  '📉 **Sell Options:**\nSelect a percentage to sell:'
}`,
      footer: mode === 'buy' ? 
        "Choose an amount to buy or switch to sell mode" :
        "Choose a percentage to sell or switch to buy mode"
    };
  }

  /**
   * Get trading confirmation screen
   */
  static getTradingConfirmationScreen(tradeData: any) {
    const { mode, amount, estimatedTokens, slippage, gasEstimate } = tradeData;
    
    return {
      title: "✅ Trade Confirmation",
      description: `
*${mode.toUpperCase()} Order Details*

📊 **Trade Summary:**
• Mode: ${mode.toUpperCase()}
• Amount: ${amount} ${mode === 'buy' ? 'ETH' : 'tokens'}
• Estimated ${mode === 'buy' ? 'Tokens' : 'ETH'}: ${estimatedTokens}
• Slippage: ${slippage}%
• Gas Estimate: ${gasEstimate} ETH

💰 **Total Cost:**
• Trade Amount: ${amount} ${mode === 'buy' ? 'ETH' : 'tokens'}
• Gas Fee: ${gasEstimate} ETH
• **Total:** ${tradeData.totalCost} ETH

⚠️ **Please confirm this trade**`,
      footer: "Review the details and confirm to execute the trade"
    };
  }

  /**
   * Get trading success screen
   */
  static getTradingSuccessScreen(tradeData: any) {
    const { mode, amount, tokensReceived, transactionHash } = tradeData;
    
    return {
      title: "🎉 Trade Successful!",
      description: `
*${mode.toUpperCase()} Order Executed*

✅ **Trade Completed:**
• Mode: ${mode.toUpperCase()}
• Amount: ${amount} ${mode === 'buy' ? 'ETH' : 'tokens'}
• ${mode === 'buy' ? 'Tokens Received' : 'ETH Received'}: ${tokensReceived}
• Transaction: \`${transactionHash}\`

💰 **Updated Position:**
• New Balance: ${tradeData.newBalance} ${mode === 'buy' ? 'tokens' : 'ETH'}
• New Value: ${tradeData.newValue} ETH
• Updated P&L: ${tradeData.updatedPnL} ETH

*Your position has been updated successfully!*`,
      footer: "Use the back button to return to position details"
    };
  }
} 