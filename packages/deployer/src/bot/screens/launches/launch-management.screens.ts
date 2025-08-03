import { LaunchDetails } from '../../handlers/launches/launch-management.handler';

export interface LaunchManagementScreen {
  title: string;
  description: string;
  footer: string;
}

export class LaunchManagementScreens {
  /**
   * Get context-aware management screen
   */
  static getManagementScreen(launch: LaunchDetails): LaunchManagementScreen {
    const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
    const statusIcon = this.getStatusIcon(launch.status);
    const statusText = this.getStatusText(launch.status);
    const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');

    if (launch.status === 'not_launched') {
      return this.getPendingLaunchScreen(launch, shortAddress, statusIcon, statusText);
    } else if (launch.status === 'configuring') {
      return this.getConfiguringLaunchScreen(launch, shortAddress, statusIcon, statusText);
    } else if (launch.status === 'pending') {
      return this.getPendingExecutionScreen(launch, shortAddress, statusIcon, statusText);
    } else if (launch.status === 'executing') {
      return this.getExecutingLaunchScreen(launch, shortAddress, statusIcon, statusText);
    } else if (launch.status === 'completed') {
      return this.getActiveLaunchScreen(launch, shortAddress, statusIcon, statusText);
    } else if (launch.status === 'failed') {
      return this.getFailedLaunchScreen(launch, shortAddress, statusIcon, statusText);
    } else {
      return this.getCancelledLaunchScreen(launch, shortAddress, statusIcon, statusText);
    }
  }

  /**
   * Screen for pending launches (not yet launched)
   */
  private static getPendingLaunchScreen(
    launch: LaunchDetails,
    shortAddress: string,
    statusIcon: string,
    statusText: string
  ): LaunchManagementScreen {
    const formattedSupply = this.formatTokenAmount(launch.totalSupply);
    const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');

    return {
      title: `${statusIcon} ${escapedTokenName} - ${statusText}`,
      description: `
*Token:* ${escapedTokenName} ${launch.tokenSymbol ? `(${launch.tokenSymbol})` : ''}

📊 **Launch Status:**
• Contract: ${shortAddress} ✅
• Liquidity Pool: 🔴 Not created
• Trading: 🔴 Closed
• Your Balance: ${formattedSupply} ${launch.tokenSymbol || 'tokens'}

💧 **Liquidity Configuration:**
• Pool Status: No pool exists
• Next Step: Create pool and add liquidity
• Estimated Gas: ~0.05 ETH

⚙️ **Token Details:**
• Owner: ${launch.ownerActive ? '🟢 Active (you)' : '🔴 Renounced'}
• Trading Limits: ${launch.tradingLimitsActive ? '🔴 Active' : '🟢 Removed'}
• Total Supply: ${formattedSupply} ${launch.tokenSymbol || 'tokens'}

**Management Actions:**`,
      footer: "Choose an action to manage your launch"
    };
  }

  /**
   * Screen for configuring launches
   */
  private static getConfiguringLaunchScreen(
    launch: LaunchDetails,
    shortAddress: string,
    statusIcon: string,
    statusText: string
  ): LaunchManagementScreen {
    const formattedSupply = this.formatTokenAmount(launch.totalSupply);
    const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');

    return {
      title: `${statusIcon} ${escapedTokenName} - ${statusText}`,
      description: `
*Token:* ${escapedTokenName} ${launch.tokenSymbol ? `(${launch.tokenSymbol})` : ''}

📊 **Launch Status:**
• Contract: ${shortAddress} ✅
• Configuration: ⚙️ In Progress
• Liquidity Pool: 🔴 Not created
• Trading: 🔴 Closed

⚙️ **Configuration Progress:**
• Launch Type: ${launch.bundleWalletCount > 0 ? 'Bundle Launch' : 'Standalone Launch'}
• Liquidity: ${launch.liquidityEthAmount !== '0' ? '✅ Configured' : '❌ Not set'}
• Bundle Wallets: ${launch.bundleWalletCount > 0 ? `${launch.bundleWalletCount} wallets` : 'N/A'}

**Next Steps:**`,
      footer: "Complete configuration to proceed"
    };
  }

  /**
   * Screen for pending execution launches
   */
  private static getPendingExecutionScreen(
    launch: LaunchDetails,
    shortAddress: string,
    statusIcon: string,
    statusText: string
  ): LaunchManagementScreen {
    const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');
    return {
      title: `${statusIcon} ${escapedTokenName} - ${statusText}`,
      description: `
*Token:* ${escapedTokenName} ${launch.tokenSymbol ? `(${launch.tokenSymbol})` : ''}

📊 **Launch Status:**
• Contract: ${shortAddress} ✅
• Configuration: ✅ Complete
• Execution: ⏳ Ready to execute
• Trading: 🔴 Closed

🚀 **Execution Ready:**
• All parameters configured
• Ready to create liquidity pool
• Ready to execute launch sequence

**Execution Actions:**`,
      footer: "Ready to execute launch"
    };
  }

  /**
   * Screen for executing launches
   */
  private static getExecutingLaunchScreen(
    launch: LaunchDetails,
    shortAddress: string,
    statusIcon: string,
    statusText: string
  ): LaunchManagementScreen {
    const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');
    return {
      title: `${statusIcon} ${escapedTokenName} - ${statusText}`,
      description: `
*Token:* ${escapedTokenName} ${launch.tokenSymbol ? `(${launch.tokenSymbol})` : ''}

📊 **Launch Status:**
• Contract: ${shortAddress} ✅
• Execution: 🔄 In Progress
• Liquidity Pool: 🔄 Creating...
• Trading: 🔄 Opening...

🔄 **Execution Progress:**
• Creating liquidity pool...
• Adding initial liquidity...
• Opening trading...
• Please wait...

**Status:** Launch execution in progress`,
      footer: "Execution in progress - please wait"
    };
  }

  /**
   * Screen for active launches
   */
  private static getActiveLaunchScreen(
    launch: LaunchDetails,
    shortAddress: string,
    statusIcon: string,
    statusText: string
  ): LaunchManagementScreen {
    const formattedSupply = this.formatTokenAmount(launch.totalSupply);
    const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');

    return {
      title: `${statusIcon} ${escapedTokenName} - ${statusText}`,
      description: `
*Token:* ${escapedTokenName} ${launch.tokenSymbol ? `(${launch.tokenSymbol})` : ''}

📊 **Launch Status:**
• Contract: ${shortAddress} ✅
• Liquidity Pool: ${launch.poolExists ? '🟢 Active' : '🔴 Not found'} ${launch.poolValue ? `(${launch.poolValue})` : ''}
• Trading: ${launch.tradingOpen ? '🟢 Open' : '🔴 Closed'}
• Your Balance: ${launch.userBalance || 'Loading...'} ${launch.tokenSymbol || 'tokens'}

💧 **Pool Information:**
• Pool Value: ${launch.poolValue || 'Loading...'}
• Your LP Tokens: ${launch.lpTokenBalance || 'Loading...'}
• Pool Share: ${launch.poolShare || 'Loading...'}
• Fees Earned: ${launch.feesEarned || 'Loading...'}

⚙️ **Token Details:**
• Owner: ${launch.ownerActive ? '🟢 Active (you)' : '🔴 Renounced'}
• Trading Limits: ${launch.tradingLimitsActive ? '🔴 Active' : '🟢 Removed'}
• Current Price: ${launch.currentPrice || 'Loading...'}

**Management Actions:**`,
      footer: "Choose an action to manage your launch"
    };
  }

  /**
   * Screen for failed launches
   */
  private static getFailedLaunchScreen(
    launch: LaunchDetails,
    shortAddress: string,
    statusIcon: string,
    statusText: string
  ): LaunchManagementScreen {
    const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');
    return {
      title: `${statusIcon} ${escapedTokenName} - ${statusText}`,
      description: `
*Token:* ${escapedTokenName} ${launch.tokenSymbol ? `(${launch.tokenSymbol})` : ''}

📊 **Launch Status:**
• Contract: ${shortAddress} ✅
• Launch Status: ❌ Failed
• Error: ${launch.error || 'Unknown error'}

⚠️ **What happened:**
Your token was deployed successfully, but the launch process failed. You can try launching again or manage the token manually.

**Recovery Options:**`,
      footer: "Choose how to proceed with this token"
    };
  }

  /**
   * Screen for cancelled launches
   */
  private static getCancelledLaunchScreen(
    launch: LaunchDetails,
    shortAddress: string,
    statusIcon: string,
    statusText: string
  ): LaunchManagementScreen {
    const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');
    return {
      title: `${statusIcon} ${escapedTokenName} - ${statusText}`,
      description: `
*Token:* ${escapedTokenName} ${launch.tokenSymbol ? `(${launch.tokenSymbol})` : ''}

📊 **Launch Status:**
• Contract: ${shortAddress} ✅
• Launch Status: ⚪ Cancelled
• Token: Available for new launch

**Available Actions:**`,
      footer: "Choose an action for this token"
    };
  }

  /**
   * Get status icon
   */
  private static getStatusIcon(status: string): string {
    switch (status) {
      case 'not_launched': return '🔴';
      case 'configuring': return '⚙️';
      case 'pending': return '⏳';
      case 'executing': return '🔄';
      case 'completed': return '🟢';
      case 'failed': return '❌';
      case 'cancelled': return '⚪';
      default: return '⏳';
    }
  }

  /**
   * Get status text
   */
  private static getStatusText(status: string): string {
    switch (status) {
      case 'not_launched': return 'Pending Launch';
      case 'configuring': return 'Configuring';
      case 'pending': return 'Pending Execution';
      case 'executing': return 'Executing';
      case 'completed': return 'Active Launch';
      case 'failed': return 'Failed Launch';
      case 'cancelled': return 'Cancelled Launch';
      default: return 'Unknown Status';
    }
  }

  /**
   * Format token amount for display
   */
  private static formatTokenAmount(amount: string): string {
    try {
      const parsed = parseFloat(amount);
      if (parsed >= 1000000) {
        return `${(parsed / 1000000).toFixed(1)}M`;
      } else if (parsed >= 1000) {
        return `${(parsed / 1000).toFixed(1)}K`;
      } else {
        return parsed.toFixed(0);
      }
    } catch {
      return amount;
    }
  }
} 