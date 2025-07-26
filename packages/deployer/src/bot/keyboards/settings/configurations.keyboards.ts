export const ConfigurationsKeyboards = {
  listConfigs(configs: any[]) {
    // TODO: Return keyboard for selecting/editing configs
    return { reply_markup: { inline_keyboard: [] } };
  },
  viewConfig(config: any) {
    // TODO: Return keyboard for config actions (edit, delete)
    return { reply_markup: { inline_keyboard: [] } };
  },
  createConfig(config: any) {
    return this.editConfig(config, true);
  },
  editConfig(config: any, isNew = false) {
    if (!config) return { reply_markup: { inline_keyboard: [] } };
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Name', callback_data: `config_edit_param_name_${config.id || 'new'}` },
            { text: 'Wallets', callback_data: `config_edit_param_wallets_${config.id || 'new'}` }
          ],
          [
            { text: 'ETH per wallet', callback_data: `config_edit_param_eth_${config.id || 'new'}` },
            { text: 'Total %', callback_data: `config_edit_param_totalpct_${config.id || 'new'}` }
          ],
          [
            { text: 'Per wallet %', callback_data: `config_edit_param_perwalletpct_${config.id || 'new'}` },
            { text: 'Liquidity ETH', callback_data: `config_edit_param_liquidityeth_${config.id || 'new'}` }
          ],
          [
            { text: 'Liquidity %', callback_data: `config_edit_param_liquiditypct_${config.id || 'new'}` }
          ],
          [
            { text: isNew ? 'Create' : 'Save', callback_data: `config_save_${config.id || 'new'}` },
            { text: 'Cancel', callback_data: `config_cancel_${config.id || 'new'}` }
          ]
        ]
      }
    };
  }
}; 