import { ethers } from 'ethers';
import { BundleOrchestrationService } from './src/services/bundle/bundle-orchestration.service';
import { BundleCreationService } from './src/services/bundle/bundle-creation.service';
import { BundleService } from './src/services/bundle/bundle.service';
import { LaunchService } from './src/services/launch/launch.service';
import type { BundleLaunchConfig } from './src/services/launch/launch.service';
import { CONTRACT_ADDRESSES, registerContractAddress } from './src/contracts/contract-store';

// Test configuration
const TEST_CONFIG = {
  // Network configuration
  network: 'hardhat' as const,
  rpcUrl: 'http://localhost:8545',
  
  // Test wallets (Hardhat default accounts)
  devWalletPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Account 0
  fundingWalletPrivateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Account 1
  
  // Test token configuration
  tokenAddress: '0x8fF9b5901B1556d8b37964C121f6F960cc99eac9', // Your deployed token address
  tokenName: 'TestToken',
  tokenTotalSupply: ethers.utils.parseEther('1000000').toString(), // 1M tokens
  
  // Bundle configuration
  bundle_wallet_count: 3,
  bundle_token_percent: 10, // 10% of supply
  liquidity_eth_amount: ethers.utils.parseEther('1').toString(), // 1 ETH
  liquidity_token_percent: 90, // 90% to liquidity (10% clog)
};

// Contract addresses from your hardhat fork
const HARDHAT_CONTRACTS = {
  UniswapV2Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // Mainnet factory
  UniswapV2Router02: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Mainnet router
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH address
};

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  }
];

interface ValidationResult {
  estimation: {
    initialLiquidityEth: string;
    bundleBuyEth: string;
    gasPaddingEth: string;
    totalEthRequired: string;
    expectedPriceImpact: number;
    tokensPerWallet: string;
    clogTokens: string;
    liquidityTokens: string;
  };
  actual: {
    devWalletBalanceBefore: string;
    devWalletBalanceAfter: string;
    fundingWalletBalanceBefore: string;
    fundingWalletBalanceAfter: string;
    bundleWallets: Array<{
      address: string;
      ethBalanceBefore: string;
      ethBalanceAfter: string;
      tokenBalanceAfter: string;
      ethSpent: string;
      tokensReceived: string;
    }>;
    tokenTotalSupply: string;
    clogTokens: string;
    liquidityTokens: string;
    pairAddress?: string;
    actualPriceImpact: number;
  };
  comparison: {
    ethSpentVsEstimated: string;
    tokensBoughtVsEstimated: string;
    priceImpactVsEstimated: number;
    gasUsedVsEstimated: string;
  };
}

async function validateBundleLaunch() {
  console.log('🔍 Starting Bundle Launch Validation Test\n');
  
  try {
    // Setup provider and wallets
    console.log('📡 Setting up provider and wallets...');
    const provider = new ethers.providers.JsonRpcProvider(TEST_CONFIG.rpcUrl);
    const devWallet = new ethers.Wallet(TEST_CONFIG.devWalletPrivateKey, provider);
    const fundingWallet = new ethers.Wallet(TEST_CONFIG.fundingWalletPrivateKey, provider);
    
    // Update contract addresses
    console.log('🏗️  Updating contract addresses...');
    registerContractAddress('UniswapV2Factory', HARDHAT_CONTRACTS.UniswapV2Factory, 'hardhat');
    registerContractAddress('UniswapV2Router02', HARDHAT_CONTRACTS.UniswapV2Router02, 'hardhat');
    
    // Initialize services
    console.log('⚙️  Initializing services...');
    const bundleOrchestrationService = new BundleOrchestrationService(
      provider,
      TEST_CONFIG.devWalletPrivateKey,
      TEST_CONFIG.fundingWalletPrivateKey
    );
    
    const bundleCreationService = new BundleCreationService(provider, TEST_CONFIG.network);
    const bundleService = new BundleService(
      provider,
      TEST_CONFIG.network,
      TEST_CONFIG.devWalletPrivateKey,
      TEST_CONFIG.fundingWalletPrivateKey
    );
    
    const launchService = new LaunchService(provider);
    
    // Test setup info
    console.log('\n📊 Test Configuration:');
    console.log('- Network:', await provider.getNetwork());
    console.log('- Dev wallet:', devWallet.address);
    console.log('- Funding wallet:', fundingWallet.address);
    console.log('- Token address:', TEST_CONFIG.tokenAddress);
    
    // Create token contract instance
    const tokenContract = new ethers.Contract(TEST_CONFIG.tokenAddress, ERC20_ABI, provider);
    
    // Get initial balances
    console.log('\n💰 Getting initial balances...');
    const devWalletBalanceBefore = await provider.getBalance(devWallet.address);
    const fundingWalletBalanceBefore = await provider.getBalance(fundingWallet.address);
    const devWalletTokenBalanceBefore = await tokenContract.balanceOf(devWallet.address);
    const tokenTotalSupply = await tokenContract.totalSupply();
    const tokenDecimals = await tokenContract.decimals();
    
    console.log('Initial balances:');
    console.log(`- Dev wallet ETH: ${ethers.utils.formatEther(devWalletBalanceBefore)}`);
    console.log(`- Dev wallet tokens: ${ethers.utils.formatUnits(devWalletTokenBalanceBefore, tokenDecimals)}`);
    console.log(`- Funding wallet ETH: ${ethers.utils.formatEther(fundingWalletBalanceBefore)}`);
    console.log(`- Token total supply: ${ethers.utils.formatUnits(tokenTotalSupply, tokenDecimals)}`);
    
    // Step 1: Get launch estimation
    console.log('\n🧮 Step 1: Getting launch estimation...');
    const bundleConfig: BundleLaunchConfig = {
      tokenAddress: TEST_CONFIG.tokenAddress,
      tokenName: TEST_CONFIG.tokenName,
      tokenTotalSupply: TEST_CONFIG.tokenTotalSupply,
      devWalletAddress: devWallet.address,
      fundingWalletAddress: fundingWallet.address,
      bundle_wallet_count: TEST_CONFIG.bundle_wallet_count,
      bundle_token_percent: TEST_CONFIG.bundle_token_percent,
      bundle_token_percent_per_wallet: TEST_CONFIG.bundle_token_percent / TEST_CONFIG.bundle_wallet_count,
      liquidity_eth_amount: TEST_CONFIG.liquidity_eth_amount,
      liquidity_token_percent: TEST_CONFIG.liquidity_token_percent,
    };
    
    const estimateResult = await launchService.estimateLaunch(bundleConfig);
    if (!estimateResult.success || !estimateResult.data) {
      throw new Error(`Launch estimation failed: ${estimateResult.error}`);
    }
    
    const estimation = estimateResult.data;
    console.log('Launch estimation:');
    console.log(`- Initial liquidity ETH: ${ethers.utils.formatEther(estimation.initialLiquidityEth || '0')}`);
    console.log(`- Bundle buy ETH: ${ethers.utils.formatEther(estimation.bundleBuyEth || '0')}`);
    console.log(`- Gas padding ETH: ${ethers.utils.formatEther(estimation.gasPaddingEth || '0')}`);
    console.log(`- Total required ETH: ${ethers.utils.formatEther(estimation.totalEthRequired || '0')}`);
    console.log(`- Expected price impact: ${estimation.expectedPriceImpact?.toFixed(4) || '0'}%`);
    console.log(`- Tokens per wallet: ${ethers.utils.formatUnits(estimation.tokensPerWallet || '0', tokenDecimals)}`);
    
    // Calculate expected values
    const totalSupply = ethers.BigNumber.from(TEST_CONFIG.tokenTotalSupply);
    const clogTokens = totalSupply.mul(100 - TEST_CONFIG.liquidity_token_percent).div(100);
    const liquidityTokens = totalSupply.sub(clogTokens);
    
    console.log(`- Clog tokens: ${ethers.utils.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Liquidity tokens: ${ethers.utils.formatUnits(liquidityTokens, tokenDecimals)}`);
    
    // Step 2: Orchestrate bundle (without execution)
    console.log('\n🏗️  Step 2: Orchestrating bundle...');
    const orchestrationResult = await bundleOrchestrationService.orchestrateBundleLaunch(bundleConfig);
    if (!orchestrationResult.success || !orchestrationResult.data) {
      throw new Error(`Bundle orchestration failed: ${orchestrationResult.error}`);
    }
    
    const bundleWallets = orchestrationResult.data.bundleWallets;
    console.log(`Generated ${bundleWallets.length} bundle wallets:`);
    
    // Get initial balances for bundle wallets
    const bundleWalletInitialBalances = await Promise.all(
      bundleWallets.map(async (wallet) => {
        const ethBalance = await provider.getBalance(wallet.address);
        return {
          address: wallet.address,
          ethBalanceBefore: ethBalance,
          tokenBalanceBefore: ethers.constants.Zero // Bundle wallets start with 0 tokens
        };
      })
    );
    
    bundleWalletInitialBalances.forEach((wallet, index) => {
      console.log(`- Wallet ${index + 1}: ${wallet.address}`);
      console.log(`  ETH: ${ethers.utils.formatEther(wallet.ethBalanceBefore)}`);
    });
    
    // Step 3: Create bundle
    console.log('\n📦 Step 3: Creating bundle...');
    const bundleResult = await bundleCreationService.createBundle(
      orchestrationResult.data,
      {
        network: TEST_CONFIG.network,
        maxGasPrice: ethers.utils.parseUnits('50', 'gwei').toString(),
        maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei').toString(),
        maxFeePerGas: ethers.utils.parseUnits('52', 'gwei').toString(),
      }
    );
    
    if (!bundleResult.success || !bundleResult.data) {
      throw new Error(`Bundle creation failed: ${bundleResult.error}`);
    }
    
    console.log('Bundle created:');
    console.log(`- Type: ${bundleResult.data.type}`);
    if (bundleResult.data.type === 'sequential') {
      console.log(`- Transactions: ${bundleResult.data.transactions.length}`);
    }
    console.log(`- Estimated cost: ${ethers.utils.formatEther(bundleResult.data.estimatedCost || '0')} ETH`);
    
    // Step 4: Execute bundle (this will likely fail due to token ownership, but we can capture the attempt)
    console.log('\n🚀 Step 4: Attempting bundle execution...');
    let executionResult;
    try {
      const launchResult = await bundleService.launchBundle({
        config: bundleConfig,
        network: TEST_CONFIG.network,
        devWalletPrivateKey: TEST_CONFIG.devWalletPrivateKey,
        fundingWalletPrivateKey: TEST_CONFIG.fundingWalletPrivateKey,
      });
      
      executionResult = launchResult;
      console.log('Bundle execution result:', launchResult.success ? 'Success' : 'Failed');
      if (!launchResult.success) {
        console.log('Error:', launchResult.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('Bundle execution failed (expected):', errorMessage);
      executionResult = { success: false, error: errorMessage };
    }
    
    // Step 5: Get final balances (even if execution failed, we can see what changed)
    console.log('\n💰 Step 5: Getting final balances...');
    const devWalletBalanceAfter = await provider.getBalance(devWallet.address);
    const fundingWalletBalanceAfter = await provider.getBalance(fundingWallet.address);
    const devWalletTokenBalanceAfter = await tokenContract.balanceOf(devWallet.address);
    
    // Get final balances for bundle wallets
    const bundleWalletFinalBalances = await Promise.all(
      bundleWallets.map(async (wallet) => {
        const ethBalance = await provider.getBalance(wallet.address);
        const tokenBalance = await tokenContract.balanceOf(wallet.address);
        return {
          address: wallet.address,
          ethBalanceAfter: ethBalance,
          tokenBalanceAfter: tokenBalance
        };
      })
    );
    
    // Step 6: Calculate and display validation results
    console.log('\n📊 Step 6: Validation Results');
    console.log('=' .repeat(60));
    
    // Calculate actual values
    const ethSpentByDev = devWalletBalanceBefore.sub(devWalletBalanceAfter);
    const ethSpentByFunding = fundingWalletBalanceBefore.sub(fundingWalletBalanceAfter);
    const totalEthSpent = ethSpentByDev.add(ethSpentByFunding);
    
    console.log('\n💰 ETH Balances:');
    console.log(`Dev wallet: ${ethers.utils.formatEther(devWalletBalanceBefore)} → ${ethers.utils.formatEther(devWalletBalanceAfter)} (${ethers.utils.formatEther(ethSpentByDev)})`);
    console.log(`Funding wallet: ${ethers.utils.formatEther(fundingWalletBalanceBefore)} → ${ethers.utils.formatEther(fundingWalletBalanceAfter)} (${ethers.utils.formatEther(ethSpentByFunding)})`);
    console.log(`Total ETH spent: ${ethers.utils.formatEther(totalEthSpent)}`);
    console.log(`Estimated ETH required: ${ethers.utils.formatEther(estimation.totalEthRequired || '0')}`);
    
    console.log('\n🪙 Token Balances:');
    console.log(`Dev wallet tokens: ${ethers.utils.formatUnits(devWalletTokenBalanceBefore, tokenDecimals)} → ${ethers.utils.formatUnits(devWalletTokenBalanceAfter, tokenDecimals)}`);
    console.log(`Expected clog tokens: ${ethers.utils.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`Expected liquidity tokens: ${ethers.utils.formatUnits(liquidityTokens, tokenDecimals)}`);
    
    console.log('\n👥 Bundle Wallet Results:');
    bundleWallets.forEach((wallet, index) => {
      const initial = bundleWalletInitialBalances[index];
      const final = bundleWalletFinalBalances[index];
      const ethSpent = initial.ethBalanceBefore.sub(final.ethBalanceAfter);
      const tokensReceived = final.tokenBalanceAfter;
      
      console.log(`Wallet ${index + 1} (${wallet.address}):`);
      console.log(`  ETH: ${ethers.utils.formatEther(initial.ethBalanceBefore)} → ${ethers.utils.formatEther(final.ethBalanceAfter)} (spent: ${ethers.utils.formatEther(ethSpent)})`);
      console.log(`  Tokens: 0 → ${ethers.utils.formatUnits(tokensReceived, tokenDecimals)}`);
      console.log(`  Expected tokens: ${ethers.utils.formatUnits(estimation.tokensPerWallet || '0', tokenDecimals)}`);
    });
    
    // Calculate price impact (if we have a pair address)
    let actualPriceImpact = 0;
    let pairAddress;
    
    if (executionResult?.success && executionResult.data?.orchestrationResult?.pairAddress) {
      pairAddress = executionResult.data.orchestrationResult.pairAddress;
      console.log(`\n🏦 Liquidity Pair: ${pairAddress}`);
      
      // Calculate price impact based on actual vs expected token amounts
      const totalTokensBought = bundleWalletFinalBalances.reduce(
        (sum, wallet) => sum.add(wallet.tokenBalanceAfter), 
        ethers.constants.Zero
      );
      
      if (totalTokensBought.gt(0)) {
        const expectedTokens = estimation.tokensPerWallet ? 
          ethers.BigNumber.from(estimation.tokensPerWallet).mul(bundleWallets.length) : 
          ethers.constants.Zero;
        
        if (expectedTokens.gt(0)) {
          actualPriceImpact = ((totalTokensBought.sub(expectedTokens).mul(10000).div(expectedTokens)).toNumber() / 100);
        }
      }
    }
    
    console.log('\n📈 Price Impact Analysis:');
    console.log(`Expected price impact: ${estimation.expectedPriceImpact?.toFixed(4) || '0'}%`);
    console.log(`Actual price impact: ${actualPriceImpact.toFixed(4)}%`);
    
    // Step 7: Summary and recommendations
    console.log('\n📋 Summary & Recommendations:');
    console.log('=' .repeat(60));
    
    if (executionResult?.success) {
      console.log('✅ Bundle execution completed successfully!');
    } else {
      console.log('❌ Bundle execution failed (expected due to token ownership)');
      console.log('💡 To fix this:');
      console.log('   1. Ensure dev wallet owns the tokens before launching');
      console.log('   2. Transfer tokens to dev wallet from token deployer');
      console.log('   3. Verify token contract supports required functions');
    }
    
    console.log('\n🔍 Validation Checklist:');
    console.log(`- [${totalEthSpent.gt(0) ? '✅' : '❌'}] ETH was spent during execution`);
    console.log(`- [${devWalletTokenBalanceAfter.gt(0) ? '✅' : '❌'}] Dev wallet has tokens`);
    console.log(`- [${bundleWallets.length > 0 ? '✅' : '❌'}] Bundle wallets were generated`);
    console.log(`- [${bundleWalletFinalBalances.some(w => w.tokenBalanceAfter.gt(0)) ? '✅' : '❌'}] Bundle wallets received tokens`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Transfer tokens to dev wallet for successful execution');
    console.log('2. Run this validation test again');
    console.log('3. Compare estimated vs actual values');
    console.log('4. Fine-tune calculations if needed');
    
  } catch (error) {
    console.error('❌ Validation test failed:', error);
  }
}

// Run the validation
validateBundleLaunch().catch(console.error); 