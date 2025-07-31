// Screens for managing bundle configurations in settings

function configSummary(config: any) {
  return `*${config.name}*\n` +
    `Type: ${config.bundle_type}\n` +
    `Wallets: ${config.bundle_wallet_count}\n` +
    `Supply %: ${config.total_supply_percentage}%\n` +
    `Funding Wallet: ${config.funding_wallet_id}\n` +
    (config.description ? `Description: ${config.description}` : '');
}

export const BundleConfigsScreens = {
  listConfigs(configs: any[]) {
    if (!configs || configs.length === 0) {
      return '📦 *Bundle Configurations*\n\nNo bundle configurations found. Create your first one!';
    }
    return '📦 *Bundle Configurations*\n\n' +
      configs.map((c: any, i: number) => `${i + 1}. ${configSummary(c)}`).join('\n\n');
  },

  viewConfig(config: any) {
    if (!config) return 'Bundle configuration not found.';
    return `*Bundle Configuration Details*\n\n${configSummary(config)}`;
  },

  createConfig(config: any) {
    return this.editConfig(config, true);
  },

  editConfig(config: any, isNew = false) {
    if (!config) return 'Bundle configuration not found.';
    return `${isNew ? '🆕 *Create New Bundle Configuration*' : `✏️ *Edit Configuration: ${config.name}*`}\n\n` +
      `*Name:* ${config.name}\n` +
      `*Type:* ${config.bundle_type}\n` +
      `*Wallets:* ${config.bundle_wallet_count}\n` +
      `*Supply %:* ${config.total_supply_percentage}%\n` +
      `*Funding Wallet:* ${config.funding_wallet_id}\n` +
      (config.description ? `*Description:* ${config.description}` : '') + '\n\n' +
      `Click a button below to edit a parameter, then click Save when done.`;
  }
}; 