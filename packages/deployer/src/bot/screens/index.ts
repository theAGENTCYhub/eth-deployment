// Import screen classes
import { DeploymentScreens } from './deployment.screens';
import { WalletScreens } from './wallet.screens';
import { ParameterEditingScreens } from './parameter-editing.screens';
import { GeneralScreens } from './general.screens';
import { LaunchesScreens } from './launches/launches.screens';
import { LaunchesListScreens } from './launches/launches-list.screens';
import { LaunchManagementScreens } from './launches/launch-management.screens';
import { ContractsScreens } from './contracts.screens';
import { DeploymentConfigsScreens } from './settings/deployment-configs.screens';
import { LiquidityConfigsScreens } from './settings/liquidity-configs.screens';
import { BundleConfigsScreens } from './settings/bundle-configs.screens';

// Export screen classes
export { DeploymentScreens } from './deployment.screens';
export { WalletScreens } from './wallet.screens';
export { ParameterEditingScreens } from './parameter-editing.screens';
export { GeneralScreens } from './general.screens';
export { LaunchesScreens } from './launches/launches.screens';
export { LaunchesListScreens } from './launches/launches-list.screens';
export { LaunchManagementScreens } from './launches/launch-management.screens';
export { ContractsScreens } from './contracts.screens';
export { DeploymentConfigsScreens } from './settings/deployment-configs.screens';
export { LiquidityConfigsScreens } from './settings/liquidity-configs.screens';
export { BundleConfigsScreens } from './settings/bundle-configs.screens';

// Types
export type { ScreenContent } from './types';

// Utility to escape Markdown special characters
export function escapeMarkdown(text: string): string {
    if (!text) return '';
    return text
        .replace(/([_\*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// Main BotScreens class that provides access to all screen methods
export class BotScreens {
    // General screens
    static getHomeScreen = GeneralScreens.getHomeScreen;
    static getWelcomeScreen = GeneralScreens.getWelcomeScreen;
    static getDeployScreen = GeneralScreens.getDeployScreen;
    static getErrorScreen = GeneralScreens.getErrorScreen;
    static getSuccessScreen = GeneralScreens.getSuccessScreen;

    // Parameter editing screens
    static getParameterEditingScreen = ParameterEditingScreens.getParameterEditingScreen;
    static getSingleParameterScreen = ParameterEditingScreens.getSingleParameterScreen;
    static getParameterConfirmationScreen = ParameterEditingScreens.getParameterConfirmationScreen;

    // Wallet screens
    static getWalletMainScreen = WalletScreens.getWalletMainScreen;
    static getWalletListScreen = WalletScreens.getWalletListScreen;
    static getWalletDetailScreen = WalletScreens.getWalletDetailScreen;

    // Deployment screens
    static getTemplateSelectionScreen = DeploymentScreens.getTemplateSelectionScreen;
    static getWalletSelectionScreen = DeploymentScreens.getWalletSelectionScreen;
    static getCompilationProgressScreen = DeploymentScreens.getCompilationProgressScreen;
    static getCompilationSuccessScreen = DeploymentScreens.getCompilationSuccessScreen;
    static getDeploymentSuccessScreen = DeploymentScreens.getDeploymentSuccessScreen;
    static getDeploymentSuccessWithLaunchScreen = DeploymentScreens.getDeploymentSuccessWithLaunchScreen;
    static getDeploymentErrorScreen = DeploymentScreens.getDeploymentErrorScreen;

    // Legacy launches screens (for backward compatibility)
    static getLaunchesListScreen = LaunchesScreens.getLaunchesListScreen;
    static getLaunchManagementScreen = LaunchesScreens.getLaunchManagementScreen;
    static getPositionsListScreen = LaunchesScreens.getPositionsListScreen;
    static getPositionDetailScreen = LaunchesScreens.getPositionDetailScreen;

    // Unified launches screens
    static getUnifiedLaunchesListScreen = LaunchesListScreens.getLaunchesListScreen;
    static getEmptyLaunchesScreen = LaunchesListScreens.getEmptyLaunchesScreen;

    // Unified launch management screens
    static getUnifiedLaunchManagementScreen = LaunchManagementScreens.getManagementScreen;

    // Legacy launch management screens (for backward compatibility)
    static getManagementScreen = LaunchManagementScreens.getManagementScreen;
  // static getAddLiquidityScreen = LaunchManagementScreens.getAddLiquidityScreen;
  // static getRemoveLiquidityScreen = LaunchManagementScreens.getRemoveLiquidityScreen;
  // static getCloseTradingScreen = LaunchManagementScreens.getCloseTradingScreen;
  // static getUpdateLimitsScreen = LaunchManagementScreens.getUpdateLimitsScreen;

    /**
     * Format a screen content object into a Telegram message string
     */
    static formatScreen(screen: any): string {
        let message = `*${screen.title}*\n\n${screen.description}`;

        if (screen.footer) {
            message += `\n\n${screen.footer}`;
        }

        return message;
    }
}