export const BundleConfigsKeyboards = {
  listConfigs(configs: any[]) {
    const buttons = configs.map(config => [
      { text: config.name, callback_data: `bundle_cfg_view_${config.id}` }
    ]);
    
    buttons.push([{ text: '➕ New', callback_data: 'bundle_cfg_new' }]);
    buttons.push([{ text: '🔙 Back', callback_data: 'settings' }]);
    
    return { reply_markup: { inline_keyboard: buttons } };
  },
  
  viewConfig(config: any) {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✏️ Edit', callback_data: `bundle_cfg_edit_${config.id}` },
            { text: '🗑️ Delete', callback_data: `bundle_cfg_delete_${config.id}` }
          ],
          [{ text: '🔙 Back', callback_data: 'bundle_cfg_list' }]
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
            { text: '📝 Name', callback_data: `bundle_cfg_name_${configId}` },
            { text: '📦 Type', callback_data: `bundle_cfg_type_${configId}` }
          ],
          [
            { text: '👥 Wallets', callback_data: `bundle_cfg_wallets_${configId}` },
            { text: '📊 Supply %', callback_data: `bundle_cfg_supply_${configId}` }
          ],
          [
            { text: '💰 Funding', callback_data: `bundle_cfg_funding_${configId}` }
          ],
          [
            { text: isNew ? '✅ Create' : '💾 Save', callback_data: `bundle_cfg_save_${configId}` },
            { text: '❌ Cancel', callback_data: `bundle_cfg_cancel_${configId}` }
          ]
        ]
      }
    };
  }
}; 