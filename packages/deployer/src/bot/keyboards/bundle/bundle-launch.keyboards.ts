export const BundleLaunchKeyboards = {
  edit(config: any) {
    return {
      reply_markup: {
        inline_keyboard: [
          // Token selection (top category)
          [
            { text: 'Select Token', callback_data: 'bundle_edit_token' }
          ],
          // Wallets
          [
            { text: 'Select Dev Wallet', callback_data: 'bundle_edit_devwallet' },
            { text: 'Select Funding Wallet', callback_data: 'bundle_edit_fundingwallet' }
          ],
          // Bundle Parameters
          [
            { text: 'Number of Wallets', callback_data: 'bundle_edit_wallets' },
            { text: 'Total %', callback_data: 'bundle_edit_totalpct' }
          ],
          // Split (not editable)
          [
            { text: 'Split: Equal', callback_data: 'noop' }
          ],
          // Liquidity
          [
            { text: 'Liquidity ETH', callback_data: 'bundle_edit_liquidityeth' },
            { text: 'Clog %', callback_data: 'bundle_edit_clog' }
          ],
          // Config actions
          [
            { text: '💾 Save Config', callback_data: 'bundle_save_config' },
            { text: '📂 Load Config', callback_data: 'bundle_load_config' }
          ],
          // Confirm/cancel
          [
            { text: '✅ Confirm', callback_data: 'bundle_review' },
            { text: '❌ Cancel', callback_data: 'bundle_cancel' }
          ]
        ]
      }
    };
  },
  review() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🚀 Confirm Launch', callback_data: 'bundle_confirm_launch' },
            { text: '❌ Cancel', callback_data: 'bundle_cancel' }
          ]
        ]
      }
    };
  }
}; 