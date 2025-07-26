// Screens for managing launch configurations in settings

function configSummary(config: any) {
  return `*${config.name}*\n` +
    `Wallets: ${config.bundle_wallet_count}\n` +
    `ETH per wallet: ${config.eth_per_wallet}\n` +
    `Total bundle %: ${config.bundle_token_percent}%\n` +
    `Per wallet %: ${config.bundle_token_percent_per_wallet}%\n` +
    `Liquidity ETH: ${config.liquidity_eth_amount}\n` +
    `Liquidity token %: ${config.liquidity_token_percent}%`;
}

export const ConfigurationsScreens = {
  listConfigs(configs: any[]) {
    if (!configs || configs.length === 0) {
      return '🛠️ *Launch Configurations*\n\nNo configurations found.';
    }
    return '🛠️ *Launch Configurations*\n\n' +
      configs.map((c: any, i: number) => `${i + 1}. ${configSummary(c)}`).join('\n\n');
  },

  viewConfig(config: any) {
    if (!config) return 'Configuration not found.';
    return `*Configuration Details*\n\n${configSummary(config)}`;
  },

  createConfig(config: any) {
    return this.editConfig(config, true);
  },

  editConfig(config: any, isNew = false) {
    if (!config) return 'Configuration not found.';
    return `${isNew ? '🆕 *Create New Launch Configuration*' : `✏️ *Edit Configuration: ${config.name}*`}\n\n` +
      `*Name:* ${config.name}\n` +
      `*Wallets:* ${config.bundle_wallet_count}\n` +
      `*ETH per wallet:* ${config.eth_per_wallet}\n` +
      `*Total bundle %:* ${config.bundle_token_percent}%\n` +
      `*Per wallet %:* ${config.bundle_token_percent_per_wallet}%\n` +
      `*Liquidity ETH:* ${config.liquidity_eth_amount}\n` +
      `*Liquidity token %:* ${config.liquidity_token_percent}%\n\n` +
      `Click a button below to edit a parameter, then click Save when done.`;
  }
}; 