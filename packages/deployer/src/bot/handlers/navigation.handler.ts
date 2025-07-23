import { BotContext, SessionData } from '../types';
import { BotHandlers } from './index';
import { WalletHandlers } from './wallet.handler';
import { DeploymentHandler } from './deployment.handler';

export class NavigationHandler {
  /**
   * Navigate to a specific screen
   */
  static async navigateTo(ctx: BotContext, screen: SessionData['currentScreen'], data?: any) {
    try {
      // Store navigation history
      if (!ctx.session.navigationHistory) {
        ctx.session.navigationHistory = [];
      }
      
      // Add current screen to history if it exists
      if (ctx.session.currentScreen) {
        ctx.session.navigationHistory.push({
          screen: ctx.session.currentScreen,
          data: ctx.session.currentScreenData
        });
      }
      
      // Limit history to last 10 screens
      if (ctx.session.navigationHistory.length > 10) {
        ctx.session.navigationHistory = ctx.session.navigationHistory.slice(-10);
      }
      
      // Set new screen
      ctx.session.currentScreen = screen;
      ctx.session.currentScreenData = data;
      
      // Navigate based on screen
      switch (screen) {
        case 'home':
          return await BotHandlers.showHome(ctx);
        case 'wallet_main':
          return await WalletHandlers.showWalletMain(ctx);
        case 'wallet_list':
          return await WalletHandlers.showWalletList(ctx, data?.page || 0);
        case 'wallet_detail':
          return await WalletHandlers.showWalletDetail(ctx, data?.walletId);
        case 'deploy':
          return await BotHandlers.showTemplateSelection(ctx);
        case 'template_selection':
          return await BotHandlers.showTemplateSelection(ctx);
        case 'parameter_editing':
          return await BotHandlers.showParameterEditing(ctx, data);
        case 'deployment_confirmation':
          return await BotHandlers.showDeploymentConfirmation(ctx, data);
        case 'deployment_progress':
          return await DeploymentHandler.startDeployment(ctx);
        case 'deployment_result':
          // Deployment result is handled by the deployment handler directly
          return await BotHandlers.showHome(ctx);
        default:
          return await BotHandlers.showHome(ctx);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      await BotHandlers.showError(ctx, 'Navigation failed');
    }
  }
  
  /**
   * Go back to previous screen
   */
  static async goBack(ctx: BotContext) {
    try {
      if (!ctx.session.navigationHistory || ctx.session.navigationHistory.length === 0) {
        return await BotHandlers.showHome(ctx);
      }
      
      const previousScreen = ctx.session.navigationHistory.pop();
      if (previousScreen) {
        ctx.session.currentScreen = previousScreen.screen;
        ctx.session.currentScreenData = previousScreen.data;
        
        return await this.navigateTo(ctx, previousScreen.screen, previousScreen.data);
      }
      
      return await BotHandlers.showHome(ctx);
    } catch (error) {
      console.error('Go back error:', error);
      await BotHandlers.showError(ctx, 'Failed to go back');
    }
  }
  
  /**
   * Go to home screen and clear history
   */
  static async goHome(ctx: BotContext) {
    try {
      ctx.session.navigationHistory = [];
      ctx.session.currentScreen = 'home';
      ctx.session.currentScreenData = undefined;
      
      return await BotHandlers.showHome(ctx);
    } catch (error) {
      console.error('Go home error:', error);
      await BotHandlers.showError(ctx, 'Failed to go home');
    }
  }
  
  /**
   * Get current screen info
   */
  static getCurrentScreen(ctx: BotContext) {
    return {
      screen: ctx.session.currentScreen || 'home',
      data: ctx.session.currentScreenData,
      history: ctx.session.navigationHistory || []
    };
  }
  
  /**
   * Check if can go back
   */
  static canGoBack(ctx: BotContext): boolean {
    return !!(ctx.session.navigationHistory && ctx.session.navigationHistory.length > 0);
  }
} 