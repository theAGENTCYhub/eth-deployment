import { Markup } from 'telegraf';
import { CallbackManager } from '../callbacks';

export class DeploymentKeyboards {
  // Template selection keyboard
  static getTemplateSelectionKeyboard(templates: any[]) {
    const buttons = templates.map((template, index) => 
      [Markup.button.callback(`${index + 1}. ${template.name}`, CallbackManager.generateTemplateCallback(template.id))]
    );
    
    buttons.push([Markup.button.callback('🔙 Back to Deploy', 'action_deploy')]);
    
    return Markup.inlineKeyboard(buttons);
  }

  // Deployment confirmation keyboard
  static getDeploymentConfirmationKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Start Deployment', 'start_deployment')],
      [Markup.button.callback('🔙 Back to Parameters', 'action_parameter_editing')],
      [Markup.button.callback('🏠 Home', 'action_home')]
    ]);
  }

  // Deployment success keyboard
  static getDeploymentSuccessKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Home', 'action_home')]
    ]);
  }

  // Deployment success with launch keyboard
  static getDeploymentSuccessWithLaunchKeyboard(launchId?: string) {
    const buttons = [];

    if (launchId) {
      buttons.push([
        Markup.button.callback('🚀 Configure Launch', `launch_detail_${launchId}`)
      ]);
      buttons.push([
        Markup.button.callback('🎯 View All Launches', 'action_launches')
      ]);
    } else {
      buttons.push([
        Markup.button.callback('🎯 My Launches', 'action_launches')
      ]);
    }

    buttons.push([
      Markup.button.callback('🚀 Deploy Another Token', 'action_deploy'),
      Markup.button.callback('🏠 Home', 'action_home')
    ]);

    return Markup.inlineKeyboard(buttons);
  }

  // Deployment error keyboard
  static getDeploymentErrorKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Try Again', 'retry_deployment')],
      [Markup.button.callback('🔙 Back to Parameters', 'action_parameter_editing')],
      [Markup.button.callback('🏠 Home', 'action_home')]
    ]);
  }
} 