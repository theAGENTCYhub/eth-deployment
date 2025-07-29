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
   * Contract details keyboard with enhanced actions
   */
  static getContractDetailsKeyboard(contractId: string, explorerLink?: string | null) {
    const buttons = [];
    
    if (explorerLink) {
      buttons.push([Markup.button.url('🔍 View on Explorer', explorerLink)]);
    }
    
    // Generate short callback IDs for enhanced actions
    const editNameId = CallbackManager.generateContractCallback('edit_name', contractId);
    const copyId = CallbackManager.generateContractCallback('copy', contractId);
    const refreshId = CallbackManager.generateContractCallback('refresh', contractId);
    const removeId = CallbackManager.generateContractCallback('remove', contractId);
    
    // Actions section
    buttons.push([Markup.button.callback('-- System --', 'contract_actions_header')]);
    buttons.push([
      Markup.button.callback('✏️ Rename', editNameId),
      Markup.button.callback('📋 Copy Address', copyId)
    ]);
    buttons.push([
      Markup.button.callback('🔄 Refresh Status', refreshId),
      Markup.button.callback('🗑 Remove', removeId)
    ]);
    
    // Operations section
    buttons.push([Markup.button.callback('-- Manage Contract --', 'contract_operations_header')]);
    buttons.push([Markup.button.callback('🏗️ Create Liq. Pool', CallbackManager.generateContractCallback('liq_create', contractId))]);
    buttons.push([Markup.button.callback('👑 Renounce Ownership', CallbackManager.generateContractCallback('token_renounce', contractId))]);
    buttons.push([Markup.button.callback('🔓 Open Trading', CallbackManager.generateContractCallback('token_open', contractId))]);
    
    buttons.push([
      Markup.button.callback('🔙 Back to Contracts', 'contracts_view_deployed')
    ]);

    return Markup.inlineKeyboard(buttons);
  }

  /**
   * Token functions keyboard
   */
  static getTokenFunctionsKeyboard(contractId: string) {
    // Generate short callback IDs for token functions
    const renounceId = CallbackManager.generateContractCallback('token_renounce', contractId);
    const transferId = CallbackManager.generateContractCallback('token_transfer', contractId);
    const openTradingId = CallbackManager.generateContractCallback('token_open', contractId);
    const removeLimitsId = CallbackManager.generateContractCallback('token_limits', contractId);
    const updateTaxId = CallbackManager.generateContractCallback('token_tax', contractId);
    const backId = CallbackManager.generateContractCallback('back_detail', contractId);

    return Markup.inlineKeyboard([
      [
        Markup.button.callback('👑 Renounce Ownership', renounceId),
        Markup.button.callback('🔄 Transfer Ownership', transferId)
      ],
      [
        Markup.button.callback('🔓 Open Trading', openTradingId),
        Markup.button.callback('🚀 Remove Limits', removeLimitsId)
      ],
      [
        Markup.button.callback('💸 Update Taxes', updateTaxId)
      ],
      [
        Markup.button.callback('🔙 Back to Contract', backId)
      ]
    ]);
  }

  /**
   * Liquidity pool keyboard
   */
  static getLiquidityPoolKeyboard(contractId: string, poolExists: boolean = false) {
    const addId = CallbackManager.generateContractCallback('liq_add', contractId);
    const removeId = CallbackManager.generateContractCallback('liq_remove', contractId);
    const statsId = CallbackManager.generateContractCallback('liq_stats', contractId);
    const refreshId = CallbackManager.generateContractCallback('liq_refresh', contractId);
    const backId = CallbackManager.generateContractCallback('back_detail', contractId);

    const baseButtons = [
      [
        Markup.button.callback('💧 Add Liquidity', addId),
        Markup.button.callback('📤 Remove Liquidity', removeId)
      ],
      [
        Markup.button.callback('📊 Pool Statistics', statsId),
        Markup.button.callback('🔄 Refresh Info', refreshId)
      ]
    ];

    if (!poolExists) {
      const createId = CallbackManager.generateContractCallback('liq_create', contractId);
      baseButtons.unshift([
        Markup.button.callback('🏗️ Create Pool', createId)
      ]);
    }

    baseButtons.push([
      Markup.button.callback('🔙 Back to Contract', backId)
    ]);

    return Markup.inlineKeyboard(baseButtons);
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