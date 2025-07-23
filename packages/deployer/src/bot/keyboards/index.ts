// src/bot/keyboards/index.ts
// Import keyboard classes
import { GeneralKeyboards } from './general.keyboards';
import { DeploymentKeyboards } from './deployment.keyboards';
import { WalletKeyboards } from './wallet.keyboards';
import { ParameterEditingKeyboards } from './parameter-editing.keyboards';
import { ContractsKeyboards } from './contracts.keyboards';

// Export keyboard classes
export { GeneralKeyboards } from './general.keyboards';
export { DeploymentKeyboards } from './deployment.keyboards';
export { WalletKeyboards } from './wallet.keyboards';
export { ParameterEditingKeyboards } from './parameter-editing.keyboards';
export { ContractsKeyboards } from './contracts.keyboards';

// Main BotKeyboards class that provides access to all keyboard methods
export class BotKeyboards {
  // General keyboards
  static getHomeKeyboard = GeneralKeyboards.getHomeKeyboard;
  static getDeployKeyboard = GeneralKeyboards.getDeployKeyboard;
  static getConfirmationKeyboard = GeneralKeyboards.getConfirmationKeyboard;
  static getBackKeyboard = GeneralKeyboards.getBackKeyboard;
  static getNetworkKeyboard = GeneralKeyboards.getNetworkKeyboard;
  static getErrorKeyboard = GeneralKeyboards.getErrorKeyboard;
  static getClosableKeyboard = GeneralKeyboards.getClosableKeyboard;

  // Deployment keyboards
  static getTemplateSelectionKeyboard = DeploymentKeyboards.getTemplateSelectionKeyboard;
  static getDeploymentConfirmationKeyboard = DeploymentKeyboards.getDeploymentConfirmationKeyboard;
  static getDeploymentSuccessKeyboard = DeploymentKeyboards.getDeploymentSuccessKeyboard;
  static getDeploymentErrorKeyboard = DeploymentKeyboards.getDeploymentErrorKeyboard;

  // Wallet keyboards
  static getWalletMainKeyboard = WalletKeyboards.getWalletMainKeyboard;
  static getWalletListKeyboard = WalletKeyboards.getWalletListKeyboard;
  static getWalletDetailKeyboard = WalletKeyboards.getWalletDetailKeyboard;

  // Parameter editing keyboards
  static getParameterEditingKeyboard = ParameterEditingKeyboards.getParameterEditingKeyboard;
  static getSingleParameterKeyboard = ParameterEditingKeyboards.getSingleParameterKeyboard;

  // Contracts keyboards
  static getContractsMainKeyboard = ContractsKeyboards.getContractsMainKeyboard;
  static getContractsBackKeyboard = ContractsKeyboards.getContractsBackKeyboard;
  static getDeployedContractsKeyboard = ContractsKeyboards.getDeployedContractsKeyboard;
  static getContractDetailsKeyboard = ContractsKeyboards.getContractDetailsKeyboard;
  static getRemoveConfirmationKeyboard = ContractsKeyboards.getRemoveConfirmationKeyboard;
  static getTemplatesListKeyboard = ContractsKeyboards.getTemplatesListKeyboard;
  static getTemplateDetailsKeyboard = ContractsKeyboards.getTemplateDetailsKeyboard;
  static getInstancesListKeyboard = ContractsKeyboards.getInstancesListKeyboard;
}