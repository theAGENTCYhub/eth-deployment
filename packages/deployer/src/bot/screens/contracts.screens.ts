export class ContractsScreens {
  /**
   * Enhanced contract detail screen with status indicators
   */
  static detail(contract: any, deployerWallet: any, contractStatus: any = {}): string {
    return `🏗️ *Contract Details*

📋 *Basic Information:*
• *Name:* ${contract.name || 'Unnamed Contract'}
• *Symbol:* ${contract.symbol || 'N/A'}
• *Address:* \`${contract.contract_address}\`
• *Network:* ${contract.network}

👤 *Deployment Info:*
• *Deployer:* ${deployerWallet?.nickname || 'Unknown Wallet'}
• *Wallet Address:* \`${deployerWallet?.address || 'N/A'}\`
• *Deployed:* ${new Date(contract.deployed_at).toLocaleDateString()}

⚙️ *Contract Status:*
• *Trading Open:* ${contractStatus.tradingOpen ? '🟢' : '🔴'}
• *Has Owner:* ${contractStatus.hasOwner ? '🟢' : '🔴'}
• *Liquidity Pool:* ${contractStatus.hasPool ? '🟢' : '🔴'}

*Select an action below:*`;
  }

  /**
   * Token functions screen
   */
  static tokenFunctions(contract: any, tokenStatus: any = {}): string {
    return `🏭 *Token Functions*
Contract: *${contract.name || 'Unnamed'}*

⚙️ *Current Status:*
• *Trading:* ${tokenStatus.tradingOpen ? '🟢 Open' : '🔴 Closed'}
• *Owner:* ${tokenStatus.hasOwner ? '🟢 Active' : '🔴 Renounced'}
• *Limits:* ${tokenStatus.hasLimits ? '🔴 Active' : '🟢 Removed'}

🔧 *Available Functions:*
Select a function to execute on your token contract.

⚠️ *Warning:* Some functions are irreversible!`;
  }

  /**
   * Liquidity pool screen
   */
  static liquidityPool(contract: any, poolInfo: any = {}): string {
    return `💧 *Liquidity Pool Management*
Contract: *${contract.name || 'Unnamed'}*

📊 *Pool Status:*
• *Pool Exists:* ${poolInfo.exists ? '🟢 Yes' : '🔴 No'}
• *ETH Reserves:* ${poolInfo.ethReserves || '0'} ETH
• *Token Reserves:* ${poolInfo.tokenReserves || '0'} tokens
• *Your LP Tokens:* ${poolInfo.lpBalance || '0'}

${poolInfo.exists ? 
  '⚙️ *Pool Actions:*\nAdd or remove liquidity from your pool.' : 
  '🏗️ *Create Pool:*\nNo liquidity pool exists yet. Create one to enable trading.'
}`;
  }

  /**
   * Name editing screen
   */
  static nameEditing(contract: any): string {
    return `✏️ *Edit Contract Name*

Current name: *${contract.name || 'Unnamed Contract'}*

Enter the new name for this contract (1-50 characters):

⚠️ *Note:* This will only update the display name in your bot interface. The actual contract name on the blockchain cannot be changed.`;
  }

  /**
   * Copy address confirmation screen
   */
  static copyAddress(contract: any): string {
    return `📋 *Contract Address*

Contract: *${contract.name || 'Unnamed Contract'}*

📍 *Address:*
\`${contract.contract_address}\`

✅ Address copied to clipboard!

You can now paste this address in your wallet or block explorer.`;
  }

  /**
   * Remove contract confirmation screen
   */
  static removeConfirmation(contract: any): string {
    return `🗑️ *Remove Contract*

Contract: *${contract.name || 'Unnamed Contract'}*

⚠️ *Are you sure you want to remove this contract from your list?*

**Note:** This will only remove it from your view. The contract will remain deployed on the blockchain.

This action cannot be undone.`;
  }
} 