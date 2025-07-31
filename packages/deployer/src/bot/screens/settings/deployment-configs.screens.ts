// Screens for managing deployment configurations in settings

function configSummary(config: any) {
  return `*${config.name}*\n` +
    `Template: ${config.template_id}\n` +
    `Parameters: ${Object.keys(config.parameters || {}).length} items\n` +
    (config.description ? `Description: ${config.description}` : '');
}

export const DeploymentConfigsScreens = {
  listConfigs(configs: any[]) {
    if (!configs || configs.length === 0) {
      return '📋 *Deployment Configurations*\n\nNo deployment configurations found. Create your first one!';
    }
    return '📋 *Deployment Configurations*\n\n' +
      configs.map((c: any, i: number) => `${i + 1}. ${configSummary(c)}`).join('\n\n');
  },

  viewConfig(config: any) {
    if (!config) return 'Deployment configuration not found.';
    return `*Deployment Configuration Details*\n\n${configSummary(config)}`;
  },

  createConfig(config: any) {
    return this.editConfig(config, true);
  },

  editConfig(config: any, isNew = false) {
    if (!config) return 'Deployment configuration not found.';
    return `${isNew ? '🆕 *Create New Deployment Configuration*' : `✏️ *Edit Configuration: ${config.name}*`}\n\n` +
      `*Name:* ${config.name}\n` +
      `*Template:* ${config.template_id}\n` +
      `*Parameters:* ${Object.keys(config.parameters || {}).length} items\n` +
      (config.description ? `*Description:* ${config.description}` : '') + '\n\n' +
      `Click a button below to edit a parameter, then click Save when done.`;
  },

  parameterList(parameters: any) {
    if (!parameters || Object.keys(parameters).length === 0) {
      return 'No parameters configured.';
    }
    return '📝 *Parameters:*\n\n' +
      Object.entries(parameters).map(([key, value]) => `• **${key}:** ${value}`).join('\n');
  }
}; 