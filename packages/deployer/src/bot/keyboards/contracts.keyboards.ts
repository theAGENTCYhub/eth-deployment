import { Markup } from 'telegraf';
import { DeployedContract } from '@eth-deployer/supabase';
import { CallbackManager } from '../callbacks';

export interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  sourceCode: string;
  version: string;
  category?: string;
  tags?: string[];
}

export interface ContractInstance {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export class ContractsKeyboards {
  /**
   * Main contracts keyboard
   */
  static getContractsMainKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('📋 View My Contracts', 'contracts_view_deployed')],
      [Markup.button.callback('🚀 Deploy New Token', 'action_deploy')],
      [Markup.button.callback('🔙 Back to Home', 'action_home')]
    ]);
  }

  /**
   * Back to contracts main keyboard
   */
  static getContractsBackKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Back to Contracts', 'action_contracts')],
      [Markup.button.callback('🏠 Home', 'action_home')]
    ]);
  }

  /**
   * Deployed contracts list keyboard with pagination
   */
  static getDeployedContractsKeyboard(contracts: DeployedContract[], page: number, hasMore: boolean, total: number) {
    const buttons = contracts.map((contract, index) => 
      Markup.button.callback(`${index + 1}. ${contract.contract_instance.name}`, CallbackManager.generateContractDetailCallback(contract.id))
    );

    // Group buttons in pairs for better layout
    const rows = [];
    for (let i = 0; i < buttons.length; i += 2) {
      if (i + 1 < buttons.length) {
        rows.push([buttons[i], buttons[i + 1]]);
      } else {
        rows.push([buttons[i]]);
      }
    }

    // Add pagination buttons
    const paginationRow = [];
    if (page > 0) {
      paginationRow.push(Markup.button.callback('⬅️ Previous', CallbackManager.generateContractsPageCallback(page - 1)));
    }
    if (hasMore) {
      paginationRow.push(Markup.button.callback('Next ➡️', CallbackManager.generateContractsPageCallback(page + 1)));
    }
    if (paginationRow.length > 0) {
      rows.push(paginationRow);
    }

    // Add navigation buttons
    rows.push([
      Markup.button.callback('🔙 Back to Contracts', 'action_contracts'),
      Markup.button.callback('🏠 Home', 'action_home')
    ]);

    return Markup.inlineKeyboard(rows);
  }

  /**
   * Contract details keyboard
   */
  static getContractDetailsKeyboard(contractId: string, explorerLink?: string | null) {
    const buttons = [];
    
    if (explorerLink) {
      buttons.push([Markup.button.url('🔍 View on Explorer', explorerLink)]);
    }
    
    buttons.push([
      Markup.button.callback('📋 Copy Address', CallbackManager.generateContractCopyCallback(contractId)),
      Markup.button.callback('🗑️ Remove', CallbackManager.generateContractRemoveCallback(contractId))
    ]);
    
    buttons.push([
      Markup.button.callback('🔙 Back to List', 'contracts_view_deployed'),
      Markup.button.callback('🏠 Home', 'action_home')
    ]);

    return Markup.inlineKeyboard(buttons);
  }

  /**
   * Remove confirmation keyboard
   */
  static getRemoveConfirmationKeyboard(contractId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Yes, Remove', CallbackManager.generateContractConfirmRemoveCallback(contractId)),
        Markup.button.callback('❌ Cancel', CallbackManager.generateContractDetailCallback(contractId))
      ],
      [Markup.button.callback('🔙 Back to List', 'contracts_view_deployed')]
    ]);
  }

  /**
   * Templates list keyboard (for future use)
   */
  static getTemplatesListKeyboard(templates: ContractTemplate[]) {
    const buttons = templates.map((template, index) => 
      Markup.button.callback(`${index + 1}. ${template.name}`, `contracts_template_${template.id}`)
    );

    // Group buttons in pairs for better layout
    const rows = [];
    for (let i = 0; i < buttons.length; i += 2) {
      if (i + 1 < buttons.length) {
        rows.push([buttons[i], buttons[i + 1]]);
      } else {
        rows.push([buttons[i]]);
      }
    }

    // Add navigation buttons
    rows.push([
      Markup.button.callback('🔙 Back to Contracts', 'action_contracts'),
      Markup.button.callback('🏠 Home', 'action_home')
    ]);

    return Markup.inlineKeyboard(rows);
  }

  /**
   * Template details keyboard (for future use)
   */
  static getTemplateDetailsKeyboard(templateId: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Deploy This Template', `contracts_deploy_${templateId}`)],
      [Markup.button.callback('📋 View Parameters', `contracts_params_${templateId}`)],
      [Markup.button.callback('🔙 Back to Templates', 'contracts_view_templates')],
      [Markup.button.callback('🏠 Home', 'action_home')]
    ]);
  }

  /**
   * Instances list keyboard (for future use)
   */
  static getInstancesListKeyboard(instances: ContractInstance[]) {
    const buttons = instances.map((instance, index) => 
      Markup.button.callback(`${index + 1}. ${instance.name}`, `contracts_instance_${instance.id}`)
    );

    // Group buttons in pairs for better layout
    const rows = [];
    for (let i = 0; i < buttons.length; i += 2) {
      if (i + 1 < buttons.length) {
        rows.push([buttons[i], buttons[i + 1]]);
      } else {
        rows.push([buttons[i]]);
      }
    }

    // Add navigation buttons
    rows.push([
      Markup.button.callback('🔙 Back to Contracts', 'action_contracts'),
      Markup.button.callback('🏠 Home', 'action_home')
    ]);

    return Markup.inlineKeyboard(rows);
  }
} 