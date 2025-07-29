// Import screen classes
import { DeploymentScreens } from './deployment.screens';
import { WalletScreens } from './wallet.screens';
import { ParameterEditingScreens } from './parameter-editing.screens';
import { GeneralScreens } from './general.screens';
import { LaunchesScreens } from './launches/launches.screens';
import { LaunchManagementScreens } from './launch-management.screens';
import { ContractsScreens } from './contracts.screens';

// Export screen classes
export { DeploymentScreens } from './deployment.screens';
export { WalletScreens } from './wallet.screens';
export { ParameterEditingScreens } from './parameter-editing.screens';
export { GeneralScreens } from './general.screens';
export { LaunchesScreens } from './launches/launches.screens';
export { LaunchManagementScreens } from './launch-management.screens';
export { ContractsScreens } from './contracts.screens';

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
    static getDeploymentErrorScreen = DeploymentScreens.getDeploymentErrorScreen;

    // Launches screens
    static getLaunchesListScreen = LaunchesScreens.getLaunchesListScreen;
    static getLaunchManagementScreen = LaunchesScreens.getLaunchManagementScreen;
    static getPositionsListScreen = LaunchesScreens.getPositionsListScreen;
    static getPositionDetailScreen = LaunchesScreens.getPositionDetailScreen;

    // Launch management screens
    static getManagementScreen = LaunchManagementScreens.getManagementScreen;
    static getAddLiquidityScreen = LaunchManagementScreens.getAddLiquidityScreen;
    static getRemoveLiquidityScreen = LaunchManagementScreens.getRemoveLiquidityScreen;
    static getCloseTradingScreen = LaunchManagementScreens.getCloseTradingScreen;
    static getUpdateLimitsScreen = LaunchManagementScreens.getUpdateLimitsScreen;

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