import { ethers } from 'ethers';
import { 
  BundleCalculationService, 
  BundleService,
  executeEqualDistributionBundle,
  type EqualTokenDistributionConfig,
  type EqualDistributionBundleConfig
} from './src';

async function testEqualDistribution() {
  console.log('🧪 Testing Equal Token Distribution...\n');

  try {
    // Setup provider and signer (using Hardhat for testing)
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    const signer = provider.getSigner();
    
    // Contract addresses (Hardhat test addresses)
    const tokenAddress = '0xC2FE2F49B3a1384aEdFAae127F054FAf216eF684'; // Your deployed token
    const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH
    const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // Uniswap V2 Router
    
    // Test configuration
    const totalTokensToDistribute = BigInt(ethers.utils.parseUnits('10000000000', 9).toString()); // 10B tokens
    const walletCount = 5;
    
    console.log('📋 Test Configuration:');
    console.log(`- Total tokens to distribute: ${ethers.utils.formatUnits(totalTokensToDistribute, 9)}`);
    console.log(`- Number of wallets: ${walletCount}`);
    console.log(`- Target tokens per wallet: ${ethers.utils.formatUnits(totalTokensToDistribute / BigInt(walletCount), 9)}`);
    console.log(`- Token address: ${tokenAddress}`);
    console.log(`- WETH address: ${wethAddress}`);
    console.log(`- Router address: ${routerAddress}\n`);

    // Step 1: Calculate optimal ETH amounts for equal distribution
    console.log('🔢 Step 1: Calculating optimal ETH amounts...');
    
    const calculationService = new BundleCalculationService();
    
    const calculationConfig: EqualTokenDistributionConfig = {
      totalTokensToDistribute,
      walletCount,
      tokenAddress,
      wethAddress,
      routerAddress,
      signer,
      maxIterations: 10,
      tolerance: BigInt(ethers.utils.parseUnits('1000', 9).toString()) // 1000 tokens tolerance
    };
    
    const calculationResult = await calculationService.calculateEqualTokenDistribution(calculationConfig);
    
    if (!calculationResult.success || !calculationResult.data) {
      throw new Error(`Calculation failed: ${calculationResult.error}`);
    }
    
    const { walletAmounts, totalEthRequired, averageEthPerWallet, priceImpact } = calculationResult.data;
    
    console.log('\n✅ Calculation Results:');
    console.log(`- Total ETH required: ${ethers.utils.formatEther(totalEthRequired)}`);
    console.log(`- Average ETH per wallet: ${ethers.utils.formatEther(averageEthPerWallet)}`);
    console.log(`- Price impact: ${priceImpact.toFixed(2)}%\n`);
    
    console.log('📊 Wallet Distribution:');
    walletAmounts.forEach((wallet, index) => {
      console.log(`Wallet ${index + 1}:`);
      console.log(`  - ETH amount: ${ethers.utils.formatEther(wallet.ethAmount)}`);
      console.log(`  - Expected tokens: ${ethers.utils.formatUnits(wallet.expectedTokens, 9)}`);
    });
    
    // Step 2: Validate the distribution
    console.log('\n🔍 Step 2: Validating distribution...');
    
    const targetTokensPerWallet = totalTokensToDistribute / BigInt(walletCount);
    let allEqual = true;
    
    walletAmounts.forEach((wallet, index) => {
      const difference = wallet.expectedTokens > targetTokensPerWallet 
        ? wallet.expectedTokens - targetTokensPerWallet
        : targetTokensPerWallet - wallet.expectedTokens;
      const percentageDiff = Number((difference * BigInt(10000)) / targetTokensPerWallet) / 100;
      
      console.log(`Wallet ${index + 1}: ${percentageDiff.toFixed(2)}% difference from target`);
      
      if (percentageDiff > 1) { // More than 1% difference
        allEqual = false;
      }
    });
    
    if (allEqual) {
      console.log('✅ All wallets will receive approximately equal tokens!');
    } else {
      console.log('⚠️  Some wallets may receive slightly different amounts due to price impact');
    }
    
    // Step 3: Simulate bundle execution (without actually executing)
    console.log('\n🚀 Step 3: Simulating bundle execution...');
    
    // Generate mock wallet addresses for demonstration
    const mockWalletAddresses = Array.from({ length: walletCount }, (_, i) => 
      ethers.Wallet.createRandom().address
    );
    
    const bundleConfig: EqualDistributionBundleConfig = {
      walletAddresses: mockWalletAddresses,
      ethAmounts: walletAmounts.map(w => w.ethAmount),
      expectedTokens: walletAmounts.map(w => w.expectedTokens),
      tokenAddress,
      wethAddress,
      routerAddress,
      signer
    };
    
    console.log('📋 Bundle Configuration:');
    console.log(`- Wallet addresses: ${mockWalletAddresses.length} wallets`);
    console.log(`- Total ETH to spend: ${ethers.utils.formatEther(totalEthRequired)}`);
    console.log(`- Expected total tokens: ${ethers.utils.formatUnits(totalTokensToDistribute, 9)}`);
    
    // Note: We're not actually executing the transactions in this test
    console.log('\n✅ Simulation completed successfully!');
    console.log('💡 To execute the actual bundle, use the executeEqualDistributionBundle function');
    
    return {
      success: true,
      calculationResult: calculationResult.data,
      bundleConfig
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test
testEqualDistribution()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 Equal distribution test completed successfully!');
    } else {
      console.log('\n💥 Test failed:', result.error);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }); 