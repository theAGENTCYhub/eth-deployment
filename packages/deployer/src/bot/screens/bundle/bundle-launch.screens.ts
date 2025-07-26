function escapeMarkdown(text: string): string {
  // Escape Telegram MarkdownV2 special characters
  return (text || '').replace(/[\_\*\[\]\(\)~`>#+\-=|{}.!]/g, '\\$&');
}

function bundleLaunchSummary(config: any) {
  return (
    `*Token*
` +
    `• Token: ${escapeMarkdown(config.tokenName) || 'Not selected'}\n\n` +
    `*Wallets*
` +
    `• Dev Wallet: ${escapeMarkdown(config.devWalletName) || 'Not selected'}\n` +
    `• Funding Wallet: ${escapeMarkdown(config.fundingWalletName) || 'Not selected'}\n\n` +
    `*Bundle Parameters*
` +
    `• Number of Wallets: ${escapeMarkdown(String(config.bundle_wallet_count)) || '5'}\n` +
    `• Total % of Supply: ${escapeMarkdown(String(config.bundle_token_percent)) || '10'}%\n` +
    `• Split: Equal\n\n` +
    `*Liquidity Pool*
` +
    `• Liquidity ETH: ${escapeMarkdown(config.liquidity_eth_amount) || 'Not set'}\n` +
    `• Clog: ${escapeMarkdown(String(config.clog_percent || 10))}% of supply (${escapeMarkdown(String(100 - (config.clog_percent || 10)))}% to liquidity)\n`
  );
}

export const BundleLaunchScreens = {
  edit(config: any) {
    return `*Bundle Launch Setup*\n\n` +
      bundleLaunchSummary(config) +
      `\nClick a button below to edit a parameter, then click Confirm to review your launch.`;
  },
  review(config: any, calculations: any) {
    return `*Review Bundle Launch*\n\n` +
      bundleLaunchSummary(config) +
      `\n*Bundle Calculation:*\n` +
      (calculations ? calculations.summary : '(calculations will appear here)') +
      `\nClick Confirm to proceed with the launch.`;
  },
  confirmation() {
    return `*Launching...*\n\nYour bundle launch is in progress.`;
  }
}; 