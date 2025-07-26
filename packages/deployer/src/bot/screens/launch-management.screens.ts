import { LaunchData } from './launches/launches.screens';
import { PositionData } from '../../services/trading-service-manager';

export interface LaunchManagementScreen {
  title: string;
  description: string;
  footer?: string;
}

export class LaunchManagementScreens {
  /**
   * Get the main launch management screen
   */
  static getManagementScreen(launch: LaunchData, positions: PositionData[]): LaunchManagementScreen {
    const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
    const totalPositions = positions.length;
    const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.currentValue), 0).toFixed(3);
    
    return {
      title: '🎯 Launch Management',
      description: `
*Token: ${launch.tokenName}*

📊 *Launch Details:*
• Contract: \`${shortAddress}\`
• Total Supply: ${launch.totalSupply} tokens
• Bundle Wallets: ${launch.bundleWallets} wallets

💧 *Liquidity Pool:*
• Pool Value: ${launch.poolValue} ETH
• Token Reserves: ${launch.totalSupply} tokens
• Pool Share: 100%

📈 *Positions Overview:*
• Active Positions: ${totalPositions}
• Total Position Value: ${totalValue} ETH
• Average P&L: ${launch.pnlPercentage}

*Use the buttons below to manage your launch:*
• Add/Remove Liquidity
• Control Trading
• Update Limits
• View Positions`,
      footer: 'Select an action to manage your launch'
    };
  }

  /**
   * Get add liquidity screen
   */
  static getAddLiquidityScreen(launch: LaunchData): LaunchManagementScreen {
    return {
      title: '💧 Add Liquidity',
      description: `
*Add liquidity to ${launch.tokenName}*

📊 *Current Pool:*
• Pool Value: ${launch.poolValue} ETH
• Token Reserves: ${launch.totalSupply} tokens

*This feature will allow you to:*
• Add ETH and tokens to the liquidity pool
• Earn trading fees from swaps
• Increase pool depth for better trading

*Coming soon - integration with liquidity management service*`,
      footer: 'Liquidity management features are under development'
    };
  }

  /**
   * Get remove liquidity screen
   */
  static getRemoveLiquidityScreen(launch: LaunchData): LaunchManagementScreen {
    return {
      title: '📤 Remove Liquidity',
      description: `
*Remove liquidity from ${launch.tokenName}*

📊 *Current Pool:*
• Pool Value: ${launch.poolValue} ETH
• Token Reserves: ${launch.totalSupply} tokens

*This feature will allow you to:*
• Remove ETH and tokens from the liquidity pool
• Claim earned trading fees
• Reduce your pool exposure

*Coming soon - integration with liquidity management service*`,
      footer: 'Liquidity management features are under development'
    };
  }

  /**
   * Get close trading screen
   */
  static getCloseTradingScreen(launch: LaunchData): LaunchManagementScreen {
    return {
      title: '🔒 Close Trading',
      description: `
*Close trading for ${launch.tokenName}*

⚠️ *Warning: This action will:*
• Stop all trading activity
• Prevent new buy/sell orders
• Lock the current price

*Current Status:*
• Trading: Active
• Pool Value: ${launch.poolValue} ETH
• Active Positions: ${launch.positions}

*This is a permanent action that cannot be undone.*

*Coming soon - integration with trading service*`,
      footer: 'Trading control features are under development'
    };
  }

  /**
   * Get update limits screen
   */
  static getUpdateLimitsScreen(launch: LaunchData): LaunchManagementScreen {
    return {
      title: '⚙️ Update Limits',
      description: `
*Update trading limits for ${launch.tokenName}*

📊 *Current Limits:*
• Max Buy: No limit
• Max Sell: No limit
• Slippage: 2.5%

*This feature will allow you to:*
• Set maximum buy/sell amounts
• Adjust slippage tolerance
• Configure trading parameters
• Set price limits

*Coming soon - integration with trading service*`,
      footer: 'Limit management features are under development'
    };
  }
} 