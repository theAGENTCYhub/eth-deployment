export const LiquidityConfigsKeyboards = {
  listConfigs(configs: any[]) {
    const buttons = configs.map(config => [
      { text: config.name, callback_data: `liq_cfg_view_${config.id}` }
    ]);
    
    buttons.push([{ text: '➕ New', callback_data: 'liq_cfg_new' }]);
    buttons.push([{ text: '🔙 Back', callback_data: 'settings' }]);
    
    return { reply_markup: { inline_keyboard: buttons } };
  },
  
  viewConfig(config: any) {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✏️ Edit', callback_data: `liq_cfg_edit_${config.id}` },
            { text: '🗑️ Delete', callback_data: `liq_cfg_delete_${config.id}` }
          ],
          [{ text: '🔙 Back', callback_data: 'liq_cfg_list' }]
        ]
      }
    };
  },
  
  createConfig(config: any) {
    return this.editConfig(config, true);
  },
  
  editConfig(config: any, isNew = false) {
    if (!config) return { reply_markup: { inline_keyboard: [] } };
    
    const configId = config.id || 'new';
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📝 Name', callback_data: `liq_cfg_name_${configId}` },
            { text: '💰 ETH Amount', callback_data: `liq_cfg_eth_${configId}` }
          ],
          [
            { text: '👛 Wallet', callback_data: `liq_cfg_wallet_${configId}` }
          ],
          [
            { text: isNew ? '✅ Create' : '💾 Save', callback_data: `liq_cfg_save_${configId}` },
            { text: '❌ Cancel', callback_data: `liq_cfg_cancel_${configId}` }
          ]
        ]
      }
    };
  }
}; 