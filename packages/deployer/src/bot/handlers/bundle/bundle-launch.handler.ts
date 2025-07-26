import { BundleLaunchScreens } from '../../screens/bundle/bundle-launch.screens';
import { BundleLaunchKeyboards } from '../../keyboards/bundle/bundle-launch.keyboards';
import { LaunchConfigsService, WalletService, DeployedContractsService } from '@eth-deployer/supabase';
import { 
  LaunchService, 
  BundleService,
  type BundleLaunchConfig, 
  type BundleLaunchEstimate,
  type BundleLaunchRequest,
  type BundleLaunchResponse
} from '@eth-deployer/transactions';
import { ethers } from 'ethers';
import { web3Provider } from '../../../web3/provider';
import { config } from '../../../config/env';

// Helper function to validate bundle configuration
function validateBundleConfig(config: any, tokenTotalSupply: string): string[] {
  const errors: string[] = [];
  
  // Validate bundle wallet count
  if (config.bundle_wallet_count < 2 || config.bundle_wallet_count > 20) {
    errors.push('• Bundle wallet count must be between 2 and 20');
  }
  
  // Validate bundle token percentage
  if (config.bundle_token_percent < 1 || config.bundle_token_percent > 50) {
    errors.push('• Bundle token percentage must be between 1% and 50%');
  }
  
  // Validate liquidity ETH amount
  const liquidityEth = parseFloat(config.liquidity_eth_amount);
  if (isNaN(liquidityEth) || liquidityEth < 0.1 || liquidityEth > 100) {
    errors.push('• Liquidity ETH must be between 0.1 and 100 ETH');
  }
  
  // Validate total supply is reasonable (very lenient for testing)
  const totalSupply = ethers.BigNumber.from(tokenTotalSupply);
  const minSupply = ethers.utils.parseEther('1'); // 1 token minimum (very lenient)
  const maxSupply = ethers.utils.parseEther('1000000000000'); // 1 trillion tokens maximum
  
  if (totalSupply.lt(minSupply)) {
    errors.push('• Token total supply is too low (minimum 1 token)');
  }
  if (totalSupply.gt(maxSupply)) {
    errors.push('• Token total supply is too high (maximum 1 trillion tokens)');
  }
  
  // Validate bundle size vs total supply (very lenient)
  const bundleTokens = totalSupply.mul(config.bundle_token_percent).div(100);
  const minBundleTokens = ethers.utils.parseEther('1'); // 1 token minimum per bundle (very lenient)
  if (bundleTokens.lt(minBundleTokens)) {
    errors.push('• Bundle size too small (minimum 1 token total)');
  }
  
  return errors;
}

// Helper function to format bundle estimate for display
function formatBundleEstimate(estimate: BundleLaunchEstimate, tokenDecimals: number = 18): string {
  const formatEth = (wei: string) => ethers.utils.formatEther(wei);
  const formatTokens = (wei: string) => ethers.utils.formatUnits(wei, tokenDecimals);
  
  let breakdown = `💰 *Cost Breakdown:*
• Initial Liquidity: ${formatEth(estimate.initialLiquidityEth)} ETH
• Bundle Buy: ${formatEth(estimate.bundleBuyEth)} ETH
• Gas Padding: ${formatEth(estimate.gasPaddingEth)} ETH
• **Total Required: ${formatEth(estimate.totalEthRequired)} ETH**

📊 *Per Wallet (Average):*
• ETH per Wallet: ${formatEth(estimate.ethPerWallet)} ETH
• Tokens per Wallet: ${formatTokens(estimate.tokensPerWallet)} tokens

📈 *Price Impact:*
• Expected Impact: ${estimate.expectedPriceImpact.toFixed(2)}%
• ${estimate.slippageWarning}

  📦 *Bundle Details:*
  • Total Tokens to Buy: ${formatTokens(estimate.totalTokensToBuy)} tokens
  • Tokens for Liquidity: ${formatTokens(estimate.tokensForLiquidity)} tokens
  • Tokens for Clog: ${formatTokens(estimate.tokensForClog)} tokens`;

  // Add detailed wallet breakdown if available
  if (estimate.walletBreakdown && estimate.walletBreakdown.length > 0) {
    breakdown += `\n\n📋 *Wallet Breakdown:*
${estimate.walletBreakdown.slice(0, 5).map(wallet => 
  `• Wallet ${wallet.walletIndex + 1}: ${formatEth(wallet.ethSpent)} ETH (${wallet.priceImpact.toFixed(2)}% impact)`
).join('\n')}`;
    
    if (estimate.walletBreakdown.length > 5) {
      breakdown += `\n• ... and ${estimate.walletBreakdown.length - 5} more wallets`;
    }
  }
  
  return breakdown;
}

const launchConfigsService = new LaunchConfigsService();
const walletService = new WalletService();
const deployedContractsService = new DeployedContractsService();
      // Use the web3 provider from the deployer package
      const provider = web3Provider.getProvider();
      const launchService = new LaunchService(provider);

const DEFAULT_BUNDLE_CONFIG = {
  tokenName: '',
  tokenId: '',
  bundle_wallet_count: 5,
  bundle_token_percent: 10,
  split: 'Equal',
  liquidity_eth_amount: '',
  clog_percent: 10, // % of total supply to keep (clog) - rest goes to liquidity
  fundingWalletName: '',
  fundingWalletId: '',
  devWalletName: '',
  devWalletId: '',
};

function getWalletSelectionKeyboard(wallets: any[], param: 'devWallet' | 'fundingWallet', ctx: any) {
  // Store mapping in session for this selection
  ctx.session.walletSelectionMap = {};
  return {
    reply_markup: {
      inline_keyboard: wallets.map((w: any, idx: number) => {
        ctx.session.walletSelectionMap[idx] = w.id;
        return [
          {
            text: w.name || w.address,
            callback_data: `bundle_select_wallet_${param}_${idx}`
          }
        ];
      })
    }
  };
}

function getTokenSelectionKeyboard(contracts: any[], ctx: any) {
  ctx.session.tokenSelectionMap = {};
  return {
    reply_markup: {
      inline_keyboard: contracts.map((c: any, idx: number) => {
        ctx.session.tokenSelectionMap[idx] = c.id;
        return [
          {
            text: c.name || c.contract_address,
            callback_data: `bundle_select_token_${idx}`
          }
        ];
      })
    }
  };
}

export class BundleLaunchHandler {
  static async startLaunchFlow(ctx: any) {
    ctx.session.bundleConfig = { ...DEFAULT_BUNDLE_CONFIG };
    await ctx.reply(
      BundleLaunchScreens.edit(ctx.session.bundleConfig),
      { parse_mode: 'Markdown', ...BundleLaunchKeyboards.edit(ctx.session.bundleConfig) }
    );
  }

  static async handleEditParam(ctx: any, param: string) {
    if (param === 'devWalletName' || param === 'fundingWalletName') {
      // Show wallet selection
      const userId = ctx.from?.id?.toString();
      if (!userId) return ctx.reply('User not found.');
      const result = await walletService.getWalletsByUser(userId);
      if (!result.success || !result.data || result.data.length === 0) {
        return ctx.reply('No wallets found.');
      }
      await ctx.reply(
        `Select a wallet for ${param === 'devWalletName' ? 'Dev Wallet' : 'Funding Wallet'}:`,
        getWalletSelectionKeyboard(result.data, param === 'devWalletName' ? 'devWallet' : 'fundingWallet', ctx)
      );
      return;
    }
    if (param === 'tokenName') {
      // Show token selection
      const userId = ctx.from?.id?.toString();
      if (!userId) return ctx.reply('User not found.');
      const result = await deployedContractsService.getDeployedContracts(0, 20); // get all for user
      if (!result.success || !result.data || result.data.length === 0) {
        return ctx.reply('No deployed contracts found.');
      }
      await ctx.reply(
        'Select a deployed token:',
        getTokenSelectionKeyboard(result.data, ctx)
      );
      return;
    }
    if (param === 'split') {
      return ctx.reply('Split is always set to Equal and cannot be changed.');
    }
    ctx.session.awaitingBundleParam = param;
    await ctx.reply(`Enter new value for *${param.replace(/_/g, ' ')}*:`, { parse_mode: 'Markdown' });
  }

  static async handleParamInput(ctx: any) {
    const param = ctx.session.awaitingBundleParam;
    if (!param || !ctx.session.bundleConfig) return ctx.reply('No parameter to edit.');
    const value = ctx.message.text.trim();
    // Validation logic
    if (param === 'bundle_wallet_count') {
      const n = parseInt(value, 10);
      if (isNaN(n) || n < 1 || n > 20) {
        return ctx.reply('Please enter a valid number of wallets (1-20).');
      }
      ctx.session.bundleConfig[param] = n;
    } else if (param === 'bundle_token_percent') {
      const pct = parseInt(value, 10);
      if (isNaN(pct) || pct < 1 || pct > 100) {
        return ctx.reply('Please enter a valid percent (1-100).');
      }
      ctx.session.bundleConfig[param] = pct;
    } else if (param === 'liquidity_eth_amount') {
      const eth = parseFloat(value);
      if (isNaN(eth) || eth <= 0) {
        return ctx.reply('Please enter a valid positive ETH amount (e.g., 0.5, 1, 2.34).');
      }
      ctx.session.bundleConfig[param] = eth.toString();
    } else if (param === 'clog_percent') {
      const pct = parseInt(value, 10);
      if (isNaN(pct) || pct < 1 || pct > 90) {
        return ctx.reply('Please enter a valid clog percentage (1-90%).');
      }
      ctx.session.bundleConfig[param] = pct;
    } else {
      ctx.session.bundleConfig[param] = value;
    }
    ctx.session.awaitingBundleParam = null;
    await ctx.reply(
      BundleLaunchScreens.edit(ctx.session.bundleConfig),
      { parse_mode: 'Markdown', ...BundleLaunchKeyboards.edit(ctx.session.bundleConfig) }
    );
  }

  static async handleSelectWallet(ctx: any, which: 'devWallet' | 'fundingWallet', idx: string) {
    const userId = ctx.from?.id?.toString();
    if (!userId || !ctx.session.bundleConfig) return ctx.reply('User or config not found.');
    const walletId = ctx.session.walletSelectionMap?.[idx];
    if (!walletId) return ctx.reply('Wallet not found.');
    const result = await walletService.getAllWallets();
    if (!result.success || !result.data) return ctx.reply('Wallet not found.');
    const wallet = result.data.find((w: any) => w.id === walletId);
    if (!wallet) return ctx.reply('Wallet not found.');
    if (which === 'devWallet') {
      ctx.session.bundleConfig.devWalletName = wallet.name || wallet.address;
      ctx.session.bundleConfig.devWalletId = walletId;
    } else {
      ctx.session.bundleConfig.fundingWalletName = wallet.name || wallet.address;
      ctx.session.bundleConfig.fundingWalletId = walletId;
    }
    await ctx.reply(
      BundleLaunchScreens.edit(ctx.session.bundleConfig),
      { parse_mode: 'Markdown', ...BundleLaunchKeyboards.edit(ctx.session.bundleConfig) }
    );
  }

  static async handleSelectToken(ctx: any, idx: string) {
    const tokenId = ctx.session.tokenSelectionMap?.[idx];
    const userId = ctx.from?.id?.toString();
    if (!userId || !ctx.session.bundleConfig || !tokenId) return ctx.reply('User or config not found.');
    const result = await deployedContractsService.getDeployedContractById(tokenId);
    if (!result.success || !result.data) return ctx.reply('Token not found.');
    ctx.session.bundleConfig.tokenName = result.data.contract_instance?.name || result.data.contract_address;
    ctx.session.bundleConfig.tokenId = tokenId;
    await ctx.reply(
      BundleLaunchScreens.edit(ctx.session.bundleConfig),
      { parse_mode: 'Markdown', ...BundleLaunchKeyboards.edit(ctx.session.bundleConfig) }
    );
  }

  static async saveConfig(ctx: any) {
    const userId = ctx.from?.id?.toString();
    if (!userId || !ctx.session.bundleConfig) return ctx.reply('User or config not found.');
    const config = {
      ...ctx.session.bundleConfig,
      user_id: userId,
      name: ctx.session.bundleConfig.tokenName || 'Bundle Config',
      eth_per_wallet: '0', // Placeholder, can be calculated
      liquidity_token_percent: 50, // Placeholder
    };
    const result = await launchConfigsService.create(config);
    if (!result.success) return ctx.reply('Failed to save configuration.');
    await ctx.reply('✅ Configuration saved.');
  }

  static async loadConfig(ctx: any) {
    const userId = ctx.from?.id?.toString();
    if (!userId) return ctx.reply('User not found.');
    const result = await launchConfigsService.getByUserId(userId);
    if (!result.success || !result.data || result.data.length === 0) {
      return ctx.reply('No saved configurations found.');
    }
    // For now, just load the first config
    ctx.session.bundleConfig = { ...result.data[0] };
    await ctx.reply('📂 Loaded configuration.');
    await ctx.reply(
      BundleLaunchScreens.edit(ctx.session.bundleConfig),
      { parse_mode: 'Markdown', ...BundleLaunchKeyboards.edit(ctx.session.bundleConfig) }
    );
  }

  static async reviewLaunch(ctx: any) {
    try {
      // Validate required parameters
      const bundleConfig = ctx.session.bundleConfig;
      if (!bundleConfig.tokenId || !bundleConfig.devWalletId || !bundleConfig.fundingWalletId || 
          !bundleConfig.liquidity_eth_amount || bundleConfig.bundle_wallet_count <= 0) {
        return ctx.reply('❌ Please complete all required parameters before reviewing.');
      }

      // Get token details and total supply
      const tokenResult = await deployedContractsService.getDeployedContractById(bundleConfig.tokenId);
      if (!tokenResult.success || !tokenResult.data) {
        return ctx.reply('❌ Token not found.');
      }

      // Get wallet addresses
      const walletsResult = await walletService.getAllWallets();
      if (!walletsResult.success || !walletsResult.data) {
        return ctx.reply('❌ Failed to get wallet information.');
      }

      const devWallet = walletsResult.data.find((w: any) => w.id === bundleConfig.devWalletId);
      const fundingWallet = walletsResult.data.find((w: any) => w.id === bundleConfig.fundingWalletId);
      
      if (!devWallet || !fundingWallet) {
        return ctx.reply('❌ Wallet information not found.');
      }

      // Get token total supply from contract parameters
      let tokenTotalSupply = '1000000000000000000000000'; // Default fallback
      let tokenDecimals = 18; // Default decimals
      try {
        if (tokenResult.data.contract_instance?.parameters?.TOTAL_SUPPLY) {
          const totalSupply = tokenResult.data.contract_instance.parameters.TOTAL_SUPPLY;
          tokenDecimals = tokenResult.data.contract_instance.parameters.DECIMALS || 18;
          // Total supply is already in the correct units, just convert to wei
          tokenTotalSupply = ethers.utils.parseUnits(totalSupply.toString(), tokenDecimals).toString();
          
          console.log('Token supply debug:', {
            totalSupply,
            tokenDecimals,
            tokenTotalSupply,
            humanReadable: ethers.utils.formatUnits(tokenTotalSupply, tokenDecimals)
          });
        }
      } catch (error) {
        console.warn('Failed to parse token total supply from parameters, using default:', error);
      }

      // Validate bundle configuration
      const validationErrors = validateBundleConfig(bundleConfig, tokenTotalSupply);
      if (validationErrors.length > 0) {
        return ctx.reply(`❌ Configuration errors:\n${validationErrors.join('\n')}`);
      }

      // Convert bot config to LaunchService format
      const launchConfig: BundleLaunchConfig = {
        tokenAddress: tokenResult.data.contract_address,
        tokenName: bundleConfig.tokenName,
        tokenTotalSupply: tokenTotalSupply,
        devWalletAddress: devWallet.address,
        fundingWalletAddress: fundingWallet.address,
        bundle_wallet_count: bundleConfig.bundle_wallet_count,
        bundle_token_percent: bundleConfig.bundle_token_percent,
        bundle_token_percent_per_wallet: bundleConfig.bundle_token_percent / bundleConfig.bundle_wallet_count,
        liquidity_eth_amount: ethers.utils.parseEther(bundleConfig.liquidity_eth_amount).toString(),
        liquidity_token_percent: 100 - (bundleConfig.clog_percent || 10), // Clog % subtracted from 100% = liquidity %
      };

      // Estimate the bundle launch
      const provider = web3Provider.getProvider();
      const launchService = new LaunchService(provider);
      const estimateResult = await launchService.estimateLaunch(launchConfig);
      if (!estimateResult.success) {
        return ctx.reply(`❌ Failed to estimate bundle: ${estimateResult.error}`);
      }

      const estimate = estimateResult.data;
      if (!estimate) {
        return ctx.reply('❌ Failed to get bundle estimate data.');
      }
      
      // Format the calculations for display
      const calculations = {
        summary: formatBundleEstimate(estimate, tokenDecimals)
      };

      await ctx.reply(
        BundleLaunchScreens.review(bundleConfig, calculations),
        { parse_mode: 'Markdown', ...BundleLaunchKeyboards.review() }
      );
    } catch (error) {
      console.error('Error in reviewLaunch:', error);
      await ctx.reply('❌ Failed to calculate bundle estimate. Please try again.');
    }
  }

  static async executeLaunch(ctx: any) {
    try {
      // Validate required parameters
      const bundleConfig = ctx.session.bundleConfig;
      if (!bundleConfig.tokenId || !bundleConfig.devWalletId || !bundleConfig.fundingWalletId || 
          !bundleConfig.liquidity_eth_amount || bundleConfig.bundle_wallet_count <= 0) {
        return ctx.reply('❌ Please complete all required parameters before launching.');
      }

      // Get token details and total supply
      const tokenResult = await deployedContractsService.getDeployedContractById(bundleConfig.tokenId);
      if (!tokenResult.success || !tokenResult.data) {
        return ctx.reply('❌ Token not found.');
      }

      // Get wallet details (including private keys)
      const walletsResult = await walletService.getAllWallets();
      if (!walletsResult.success || !walletsResult.data) {
        return ctx.reply('❌ Failed to get wallet information.');
      }

      const devWallet = walletsResult.data.find((w: any) => w.id === bundleConfig.devWalletId);
      const fundingWallet = walletsResult.data.find((w: any) => w.id === bundleConfig.fundingWalletId);
      
      if (!devWallet || !fundingWallet) {
        return ctx.reply('❌ Wallet information not found.');
      }

      // Get private keys
      const devPrivateKeyResult = await walletService.exportPrivateKey(bundleConfig.devWalletId);
      const fundingPrivateKeyResult = await walletService.exportPrivateKey(bundleConfig.fundingWalletId);
      
      if (!devPrivateKeyResult.success || !devPrivateKeyResult.privateKey) {
        return ctx.reply('❌ Failed to get dev wallet private key. Please ensure wallet is properly imported.');
      }
      
      if (!fundingPrivateKeyResult.success || !fundingPrivateKeyResult.privateKey) {
        return ctx.reply('❌ Failed to get funding wallet private key. Please ensure wallet is properly imported.');
      }

      // Get token total supply from contract parameters
      let tokenTotalSupply = '1000000000000000000000000'; // Default fallback
      let tokenDecimals = 18; // Default decimals
      try {
        if (tokenResult.data.contract_instance?.parameters?.TOTAL_SUPPLY) {
          const totalSupply = tokenResult.data.contract_instance.parameters.TOTAL_SUPPLY;
          tokenDecimals = tokenResult.data.contract_instance.parameters.DECIMALS || 18;
          tokenTotalSupply = ethers.utils.parseUnits(totalSupply.toString(), tokenDecimals).toString();
        }
      } catch (error) {
        console.warn('Failed to parse token total supply from parameters, using default:', error);
      }

      // Validate bundle configuration
      const validationErrors = validateBundleConfig(bundleConfig, tokenTotalSupply);
      if (validationErrors.length > 0) {
        return ctx.reply(`❌ Configuration errors:\n${validationErrors.join('\n')}`);
      }

      // Show launching message
      await ctx.reply(
        BundleLaunchScreens.confirmation(),
        { parse_mode: 'Markdown' }
      );

      // Convert bot config to LaunchService format
      const launchConfig: BundleLaunchConfig = {
        tokenAddress: tokenResult.data.contract_address,
        tokenName: bundleConfig.tokenName,
        tokenTotalSupply: tokenTotalSupply,
        devWalletAddress: devWallet.address,
        fundingWalletAddress: fundingWallet.address,
        bundle_wallet_count: bundleConfig.bundle_wallet_count,
        bundle_token_percent: bundleConfig.bundle_token_percent,
        bundle_token_percent_per_wallet: bundleConfig.bundle_token_percent / bundleConfig.bundle_wallet_count,
        liquidity_eth_amount: ethers.utils.parseEther(bundleConfig.liquidity_eth_amount).toString(),
        liquidity_token_percent: 100 - (bundleConfig.clog_percent || 10), // Clog % subtracted from 100% = liquidity %
      };

      // Create execution configuration
      const executionConfig = {
        network: config.NETWORK as 'hardhat' | 'sepolia' | 'mainnet', // Use environment config
        devWalletPrivateKey: devPrivateKeyResult.privateKey,
        fundingWalletPrivateKey: fundingPrivateKeyResult.privateKey,
        maxGasPrice: ethers.utils.parseUnits('50', 'gwei').toString(), // 50 gwei max
        maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei').toString(), // 2 gwei priority fee
        maxFeePerGas: ethers.utils.parseUnits('52', 'gwei').toString(), // 52 gwei max fee
        targetBlock: undefined, // Let the service decide
        bundleTimeout: 300 // 5 minutes timeout
      };

      // Execute the launch using BundleService
      const userId = ctx.from?.id?.toString() || 'unknown';
      
      // Debug: Test provider connection
      try {
        console.log('Testing provider connection before launch...');
        const network = await provider.getNetwork();
        console.log('Provider network:', network);
        const blockNumber = await provider.getBlockNumber();
        console.log('Current block number:', blockNumber);
      } catch (error) {
        console.error('Provider test failed:', error);
        await ctx.reply('❌ Provider connection test failed. Please check your network configuration.');
        return;
      }

      // Create BundleService with proper parameters
      const bundleService = new BundleService(
        provider,
        config.NETWORK as 'hardhat' | 'sepolia' | 'mainnet',
        devPrivateKeyResult.privateKey,
        fundingPrivateKeyResult.privateKey
      );

      // Create bundle launch request
      const bundleRequest: BundleLaunchRequest = {
        config: launchConfig,
        network: config.NETWORK as 'hardhat' | 'sepolia' | 'mainnet',
        devWalletPrivateKey: devPrivateKeyResult.privateKey,
        fundingWalletPrivateKey: fundingPrivateKeyResult.privateKey,
        userId: userId, // Add userId for database operations
        bundleConfig: {
          network: config.NETWORK as 'hardhat' | 'sepolia' | 'mainnet',
          maxGasPrice: ethers.utils.parseUnits('50', 'gwei').toString(),
          maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei').toString(),
          maxFeePerGas: ethers.utils.parseUnits('52', 'gwei').toString(),
          targetBlock: undefined,
          bundleTimeout: 300
        }
      };

      // Execute the bundle launch
      const launchResult = await bundleService.launchBundle(bundleRequest);

      if (!launchResult.success) {
        await ctx.reply(`❌ Bundle launch failed: ${launchResult.error}`);
        return;
      }

      const result = launchResult.data;
      if (!result) {
        await ctx.reply('❌ Bundle launch failed: No result data received.');
        return;
      }

      // Format success message
      const formatEth = (wei: string) => ethers.utils.formatEther(wei);
      const formatTokens = (wei: string) => ethers.utils.formatUnits(wei, tokenDecimals);

      // Get transaction count based on bundle type
      const transactionCount = result.bundleResult.type === 'sequential' 
        ? result.bundleResult.transactions.length 
        : result.bundleResult.bundle.signedTransactions.length;

      const successMessage = `🚀 *Bundle Launch Successful\\!*

📋 *Launch Details:*
• **Token:** ${bundleConfig.tokenName}
• **Bundle Wallets:** ${bundleConfig.bundle_wallet_count}
• **Network:** ${config.NETWORK}

📊 *Bundle Results:*
• **Bundle Type:** ${result.bundleResult.type}
• **Transactions:** ${transactionCount} transactions
• **Estimated Cost:** ${ethers.utils.formatEther(result.bundleResult.estimatedCost)} ETH

💰 *Execution Results:*
• **Bundle Hash:** \`${result.executionResult?.bundleHash || 'N/A'}\`
• **Transaction Hashes:** ${result.executionResult?.txHashes?.length || 0} transactions

📈 *Orchestration Results:*
• **Bundle Wallets:** ${result.orchestrationResult?.bundleWallets?.length || 0} wallets
• **Total Positions:** ${result.orchestrationResult?.positions?.length || 0} positions${result.databaseResult ? `

🗄️ *Database Results:*
• **Launch ID:** \`${result.databaseResult.launchId}\`
• **Stored Wallets:** ${result.databaseResult.bundleWallets.length} wallets
• **Stored Positions:** ${result.databaseResult.positions.length} positions` : ''}

*Your bundle launch has been completed successfully\\!*`;

      await ctx.reply(successMessage, { parse_mode: 'Markdown' });

      // Clear the bundle config from session
      ctx.session.bundleConfig = undefined;

    } catch (error) {
      console.error('Error in executeLaunch:', error);
      await ctx.reply('❌ Bundle launch failed with an unexpected error. Please try again.');
    }
  }
} 