import { ethers } from 'ethers';
import { BundleOrchestrationService } from './src/services/bundle/bundle-orchestration.service';
import { BundleCreationService } from './src/services/bundle/bundle-creation.service';
import { BundleService } from './src/services/bundle/bundle.service';
import { LaunchService } from './src/services/launch/launch.service';
import type { BundleLaunchConfig } from './src/services/launch/launch.service';
import { CONTRACT_ADDRESSES, registerContractAddress } from './src/contracts/contract-store';

// Test configuration - UPDATE THESE FOR YOUR SETUP
const TEST_CONFIG = {
  // Network configuration
  network: 'hardhat' as const,
  rpcUrl: 'http://localhost:8545',
  
  // Test wallets (Hardhat default accounts)
  devWalletPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Account 0
  fundingWalletPrivateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Account 1
  
  // Test token configuration - Your deployed ERC20 token
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

async function testBundleLaunch() {
  console.log('🚀 Starting Bundle Launch Test Suite\n');
  
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
    console.log('- Contract addresses:', CONTRACT_ADDRESSES[TEST_CONFIG.network]);
    
    // Test 1: Individual Transaction Builders
    console.log('\n🧪 Test 1: Individual Transaction Builders');
    console.log('=' .repeat(50));
    
    try {
      const { buildClogTransferTx } = await import('./src/transactions/erc20.transaction');
      const clogResult = await buildClogTransferTx({
        signer: devWallet,
        tokenAddress: TEST_CONFIG.tokenAddress,
        to: TEST_CONFIG.tokenAddress,
        amount: ethers.utils.parseEther('100000'),
        nonce: await devWallet.getTransactionCount(),
        gasLimit: ethers.utils.parseUnits('100000', 'wei'),
        gasPrice: ethers.utils.parseUnits('20', 'gwei')
      });
      
      if (clogResult.success) {
        console.log('✅ Clog transfer transaction built successfully');
        console.log('   Gas limit:', clogResult.data?.tx.gasLimit?.toString());
      } else {
        console.log('❌ Clog transfer failed:', clogResult.error);
      }
    } catch (error) {
      console.log('❌ Clog transfer error:', error);
    }
    
    try {
      const { buildUniswapCreatePairTx } = await import('./src/transactions/uniswap-factory.transaction');
      const pairResult = await buildUniswapCreatePairTx({
        signer: devWallet,
        tokenA: TEST_CONFIG.tokenAddress,
        tokenB: HARDHAT_CONTRACTS.WETH,
        nonce: await devWallet.getTransactionCount(),
        gasLimit: ethers.utils.parseUnits('200000', 'wei'),
        gasPrice: ethers.utils.parseUnits('20', 'gwei'),
        network: TEST_CONFIG.network
      });
      
      if (pairResult.success) {
        console.log('✅ Create pair transaction built successfully');
        console.log('   Gas limit:', pairResult.data?.tx.gasLimit?.toString());
      } else {
        console.log('❌ Create pair failed:', pairResult.error);
      }
    } catch (error) {
      console.log('❌ Create pair error:', error);
    }
    
    // Test 2: Bundle Orchestration
    console.log('\n🧪 Test 2: Bundle Orchestration');
    console.log('=' .repeat(50));
    
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
    
    try {
      const orchestrationResult = await bundleOrchestrationService.orchestrateBundleLaunch(bundleConfig);
      
      if (orchestrationResult.success && orchestrationResult.data) {
        console.log('✅ Bundle orchestration successful');
        console.log('   Bundle wallets:', orchestrationResult.data.bundleWallets.length);
        console.log('   Transactions:', orchestrationResult.data.transactions.length);
        console.log('   Signed transactions:', orchestrationResult.data.signedTransactions.length);
        console.log('   Total gas estimate:', ethers.utils.formatEther(orchestrationResult.data.totalGasEstimate || '0'), 'ETH');
        
        // Test 3: Bundle Creation
        console.log('\n🧪 Test 3: Bundle Creation');
        console.log('=' .repeat(50));
        
        const bundleResult = await bundleCreationService.createBundle(
          orchestrationResult.data,
          {
            network: TEST_CONFIG.network,
            maxGasPrice: ethers.utils.parseUnits('50', 'gwei').toString(),
            maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei').toString(),
            maxFeePerGas: ethers.utils.parseUnits('52', 'gwei').toString(),
          }
        );
        
        if (bundleResult.success && bundleResult.data) {
          console.log('✅ Bundle creation successful');
          console.log('   Type:', bundleResult.data.type);
          if (bundleResult.data.type === 'sequential') {
            console.log('   Transactions:', bundleResult.data.transactions.length);
          }
          console.log('   Estimated cost:', ethers.utils.formatEther(bundleResult.data.estimatedCost || '0'), 'ETH');
        } else {
          console.log('❌ Bundle creation failed:', bundleResult.error);
        }
      } else {
        console.log('❌ Bundle orchestration failed:', orchestrationResult.error);
      }
    } catch (error) {
      console.log('❌ Bundle orchestration error:', error);
    }
    
    // Test 4: Launch Estimation
    console.log('\n🧪 Test 4: Launch Estimation');
    console.log('=' .repeat(50));
    
    try {
      const estimateResult = await launchService.estimateLaunch(bundleConfig);
      
      if (estimateResult.success && estimateResult.data) {
        console.log('✅ Launch estimation successful');
        console.log('   Initial liquidity ETH:', ethers.utils.formatEther(estimateResult.data.initialLiquidityEth || '0'));
        console.log('   Bundle buy ETH:', ethers.utils.formatEther(estimateResult.data.bundleBuyEth || '0'));
        console.log('   Gas padding ETH:', ethers.utils.formatEther(estimateResult.data.gasPaddingEth || '0'));
        console.log('   Total required ETH:', ethers.utils.formatEther(estimateResult.data.totalEthRequired || '0'));
        console.log('   Expected price impact:', estimateResult.data.expectedPriceImpact?.toFixed(2) + '%');
        console.log('   Tokens per wallet:', ethers.utils.formatEther(estimateResult.data.tokensPerWallet || '0'));
      } else {
        console.log('❌ Launch estimation failed:', estimateResult.error);
      }
    } catch (error) {
      console.log('❌ Launch estimation error:', error);
    }
    
    // Test 5: Full Bundle Launch (will likely fail without proper setup)
    console.log('\n🧪 Test 5: Full Bundle Launch');
    console.log('=' .repeat(50));
    
    try {
      const launchResult = await bundleService.launchBundle({
        config: bundleConfig,
        network: TEST_CONFIG.network,
        devWalletPrivateKey: TEST_CONFIG.devWalletPrivateKey,
        fundingWalletPrivateKey: TEST_CONFIG.fundingWalletPrivateKey,
      });
      
      if (launchResult.success) {
        console.log('✅ Full bundle launch successful!');
        console.log('   Bundle result:', launchResult.data);
      } else {
        console.log('❌ Full bundle launch failed (expected without proper setup):', launchResult.error);
      }
    } catch (error) {
      console.log('❌ Full bundle launch error (expected without proper setup):', error);
    }
    
    console.log('\n🎉 Test suite completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Update HARDHAT_CONTRACTS with your actual deployed contract addresses');
    console.log('2. Update TEST_CONFIG.tokenAddress with your deployed token address');
    console.log('3. Ensure your hardhat fork has the required contracts deployed');
    console.log('4. Run this test again to verify everything works');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the test
testBundleLaunch().catch(console.error); 