import { LaunchSummary } from '../../handlers/launches/launches-list.handler';

export interface LaunchesListScreen {
  title: string;
  description: string;
  footer: string;
}

export interface GroupedLaunches {
  notLaunched: LaunchSummary[];
  configuring: LaunchSummary[];
  pending: LaunchSummary[];
  executing: LaunchSummary[];
  active: LaunchSummary[];
  failed: LaunchSummary[];
  cancelled: LaunchSummary[];
}

export class LaunchesListScreens {
  /**
   * Get launches list screen
   */
  static getLaunchesListScreen(
    groupedLaunches: GroupedLaunches,
    page: number,
    totalPages: number,
    totalItems: number
  ): LaunchesListScreen {
    
    if (totalItems === 0) {
      return this.getEmptyLaunchesScreen();
    }

    const { notLaunched, configuring, pending, executing, active, failed, cancelled } = groupedLaunches;
    
    let description = `*All your tokens in one place:*\n\n`;

    // Not launched section
    if (notLaunched.length > 0) {
      description += `**🔴 Pending Launches (${notLaunched.length})**\n`;
      notLaunched.slice(0, 3).forEach(launch => {
        const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
        const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');
        description += `• ${escapedTokenName} ${shortAddress} - Ready to launch\n`;
      });
      if (notLaunched.length > 3) {
        description += `• ... and ${notLaunched.length - 3} more\n`;
      }
      description += '\n';
    }

    // Configuring section
    if (configuring.length > 0) {
      description += `**⚙️ Configuring (${configuring.length})**\n`;
      configuring.slice(0, 2).forEach(launch => {
        const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
        const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');
        description += `• ${escapedTokenName} ${shortAddress} - Setting up launch\n`;
      });
      if (configuring.length > 2) {
        description += `• ... and ${configuring.length - 2} more\n`;
      }
      description += '\n';
    }

    // Pending section
    if (pending.length > 0) {
      description += `**⏳ Pending Execution (${pending.length})**\n`;
      pending.slice(0, 2).forEach(launch => {
        const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
        const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');
        description += `• ${escapedTokenName} ${shortAddress} - Ready to execute\n`;
      });
      if (pending.length > 2) {
        description += `• ... and ${pending.length - 2} more\n`;
      }
      description += '\n';
    }

    // Executing section
    if (executing.length > 0) {
      description += `**🔄 Executing (${executing.length})**\n`;
      executing.slice(0, 2).forEach(launch => {
        const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
        const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');
        description += `• ${escapedTokenName} ${shortAddress} - Launch in progress\n`;
      });
      if (executing.length > 2) {
        description += `• ... and ${executing.length - 2} more\n`;
      }
      description += '\n';
    }

    // Active launches section
    if (active.length > 0) {
      description += `**🟢 Active Launches (${active.length})**\n`;
      active.slice(0, 3).forEach(launch => {
        const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
        const tradingStatus = launch.tradingOpen ? 'Open' : 'Closed';
        const poolInfo = launch.poolValue ? `, Pool: ${launch.poolValue}` : '';
        const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');
        description += `• ${escapedTokenName} ${shortAddress} - Trading: ${tradingStatus}${poolInfo}\n`;
      });
      if (active.length > 3) {
        description += `• ... and ${active.length - 3} more\n`;
      }
      description += '\n';
    }

    // Failed launches section
    if (failed.length > 0) {
      description += `**❌ Failed Launches (${failed.length})**\n`;
      failed.slice(0, 2).forEach(launch => {
        const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
        const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');
        description += `• ${escapedTokenName} ${shortAddress} - Launch failed\n`;
      });
      if (failed.length > 2) {
        description += `• ... and ${failed.length - 2} more\n`;
      }
      description += '\n';
    }

    // Cancelled launches section
    if (cancelled.length > 0) {
      description += `**⚪ Cancelled Launches (${cancelled.length})**\n`;
      cancelled.slice(0, 2).forEach(launch => {
        const shortAddress = `${launch.tokenAddress.slice(0, 6)}...${launch.tokenAddress.slice(-4)}`;
        const escapedTokenName = launch.tokenName.replace(/_/g, '\\_');
        description += `• ${escapedTokenName} ${shortAddress} - Launch cancelled\n`;
      });
      if (cancelled.length > 2) {
        description += `• ... and ${cancelled.length - 2} more\n`;
      }
      description += '\n';
    }

    // Pagination info
    if (totalPages > 1) {
      description += `*Page ${page + 1} of ${totalPages} • Total: ${totalItems} launches*\n\n`;
    }

    description += `*Tap any launch to manage it*`;

    return {
      title: "🎯 My Launches",
      description,
      footer: "Select a launch to manage or configure"
    };
  }

  /**
   * Get empty launches screen
   */
  static getEmptyLaunchesScreen(): LaunchesListScreen {
    return {
      title: "🎯 My Launches",
      description: `
*No launches found*

You haven't deployed any tokens yet.

**Get Started:**
• Deploy your first ERC20 token
• Automatically create launch records
• Manage everything from this interface

*Ready to deploy your first token?*`,
      footer: "Use the buttons below to get started"
    };
  }
} 