// Screens for managing liquidity configurations in settings

function configSummary(config: any) {
  return `*${config.name}*\n` +
    `ETH Amount: ${config.initial_liquidity_eth}\n` +
    `Wallet: ${config.liquidity_wallet_id}\n` +
    (config.description ? `Description: ${config.description}` : '');
}

export const LiquidityConfigsScreens = {
  listConfigs(configs: any[]) {
    if (!configs || configs.length === 0) {
      return '💧 *Liquidity Configurations*\n\nNo liquidity configurations found. Create your first one!';
    }
    return '💧 *Liquidity Configurations*\n\n' +
      configs.map((c: any, i: number) => `${i + 1}. ${configSummary(c)}`).join('\n\n');
  },

  viewConfig(config: any) {
    if (!config) return 'Liquidity configuration not found.';
    return `*Liquidity Configuration Details*\n\n${configSummary(config)}`;
  },

  createConfig(config: any) {
    return this.editConfig(config, true);
  },

  editConfig(config: any, isNew = false) {
    if (!config) return 'Liquidity configuration not found.';
    return `${isNew ? '🆕 *Create New Liquidity Configuration*' : `✏️ *Edit Configuration: ${config.name}*`}\n\n` +
      `*Name:* ${config.name}\n` +
      `*ETH Amount:* ${config.initial_liquidity_eth}\n` +
      `*Wallet:* ${config.liquidity_wallet_id}\n` +
      (config.description ? `*Description:* ${config.description}` : '') + '\n\n' +
      `Click a button below to edit a parameter, then click Save when done.`;
  }
}; 