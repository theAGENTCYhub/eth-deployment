import { Markup } from 'telegraf';
import { LaunchSummary } from '../../handlers/launches/launches-list.handler';

export class LaunchesListKeyboards {
  /**
   * Get launches list keyboard
   */
  static getLaunchesListKeyboard(
    launches: LaunchSummary[],
    page: number,
    hasMore: boolean,
    hasPrev: boolean
  ) {
    const buttons = [];

    if (launches.length === 0) {
      // Empty state buttons
      buttons.push([
        Markup.button.callback('🚀 Deploy First Token', 'action_deploy')
      ]);
      buttons.push([
        Markup.button.callback('🏠 Home', 'action_home')
      ]);
    } else {
      // Launch selection buttons (show up to 5 per page)
      const launchButtons = launches.slice(0, 5).map((launch, index) => {
        const displayName = this.truncateName(launch.tokenName, 20);
        const statusIcon = this.getStatusIcon(launch.status);
        return Markup.button.callback(
          `${statusIcon} ${displayName}`,
          `launch_detail_${launch.shortId}`
        );
      });

      // Group buttons in pairs for better layout
      for (let i = 0; i < launchButtons.length; i += 2) {
        if (i + 1 < launchButtons.length) {
          buttons.push([launchButtons[i], launchButtons[i + 1]]);
        } else {
          buttons.push([launchButtons[i]]);
        }
      }

      // Pagination buttons
      if (hasPrev || hasMore) {
        const paginationRow = [];
        if (hasPrev) {
          paginationRow.push(Markup.button.callback('⬅️ Previous', `launches_page_${page - 1}`));
        }
        if (hasMore) {
          paginationRow.push(Markup.button.callback('Next ➡️', `launches_page_${page + 1}`));
        }
        buttons.push(paginationRow);
      }

      // Action buttons
      buttons.push([
        Markup.button.callback('🚀 Deploy New Token', 'action_deploy')
      ]);
    }

    // Navigation
    buttons.push([
      Markup.button.callback('🏠 Home', 'action_home')
    ]);

    return Markup.inlineKeyboard(buttons);
  }

  /**
   * Get status icon for launch
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
   * Truncate name for button display
   */
  private static truncateName(name: string, maxLength: number): string {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  }
} 