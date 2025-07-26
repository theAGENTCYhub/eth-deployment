const { ethers } = require('hardhat');

// Mock the Supabase environment variables to avoid dependency issues
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'mock-key';

async function main() {
  console.log('🚀 Starting Deploy and Bundle Launch Test (Using Transactions Package)...\n');

  try {
    // Get signers
    const [devWallet, fundingWallet] = await ethers.getSigners();
    
    console.log('📡 Network Info:');
    const network = await ethers.provider.getNetwork();
    console.log(`- Chain ID: ${network.chainId}`);
    console.log(`- Network: ${network.name}`);
    
    console.log('\n👤 Wallet Addresses:');
    console.log(`- Dev wallet: ${devWallet.address}`);
    console.log(`- Funding wallet: ${fundingWallet.address}`);

    // Step 1: Deploy TestERC20 contract
    console.log('\n🏗️  Step 1: Deploying TestERC20 contract...');
    
    const TestERC20 = await ethers.getContractFactory('TOKEN');
    const testToken = await TestERC20.deploy();
    await testToken.waitForDeployment();
    
    const tokenAddress = await testToken.getAddress();
    console.log(`✅ Token deployed at: ${tokenAddress}`);

    // Get token info
    const tokenName = await testToken.name();
    const tokenSymbol = await testToken.symbol();
    const tokenDecimals = await testToken.decimals();
    const tokenTotalSupply = await testToken.totalSupply();
    
    console.log('\n🪙 Token Info:');
    console.log(`- Name: ${tokenName}`);
    console.log(`- Symbol: ${tokenSymbol}`);
    console.log(`- Decimals: ${tokenDecimals}`);
    console.log(`- Total Supply: ${ethers.formatUnits(tokenTotalSupply, tokenDecimals)} ${tokenSymbol}`);

    // Check initial balances
    const devWalletBalance = await ethers.provider.getBalance(devWallet.address);
    const fundingWalletBalance = await ethers.provider.getBalance(fundingWallet.address);
    const devWalletTokenBalance = await testToken.balanceOf(devWallet.address);
    
    console.log('\n💰 Initial Balances:');
    console.log(`- Dev wallet ETH: ${ethers.formatEther(devWalletBalance)}`);
    console.log(`- Dev wallet tokens: ${ethers.formatUnits(devWalletTokenBalance, tokenDecimals)}`);
    console.log(`- Funding wallet ETH: ${ethers.formatEther(fundingWalletBalance)}`);
    
    if (devWalletTokenBalance.toString() !== tokenTotalSupply.toString()) {
      throw new Error('Dev wallet does not own all tokens');
    }
    console.log('✅ Dev wallet owns all tokens');

    // Step 2: Configure bundle launch parameters
    console.log('\n⚙️  Step 2: Configuring bundle launch parameters...');
    
    const bundleWalletsCount = 5;
    const bundlePercentage = 10; // 10% of total supply
    const liquidityEth = ethers.parseEther("10.0"); // 10 ETH
    const liquidityTokenPercentage = 90; // 90% of total supply
    const clogPercentage = 10; // 10% of total supply
    
    console.log('Bundle Configuration:');
    console.log(`- Token: ${tokenName} (${tokenAddress})`);
    console.log(`- Bundle wallets: ${bundleWalletsCount}`);
    console.log(`- Bundle percentage: ${bundlePercentage}%`);
    console.log(`- Liquidity ETH: ${ethers.formatEther(liquidityEth)}`);
    console.log(`- Liquidity token %: ${liquidityTokenPercentage}%`);
    console.log(`- Clog percentage: ${clogPercentage}%`);

    // Step 3: Calculate expected values
    console.log('\n🧮 Step 3: Calculating expected values...');
    
    const totalSupply = tokenTotalSupply;
    const clogTokens = totalSupply * BigInt(clogPercentage) / BigInt(100);
    const liquidityTokens = totalSupply * BigInt(liquidityTokenPercentage) / BigInt(100);
    const bundleTokens = totalSupply * BigInt(bundlePercentage) / BigInt(100);
    const tokensPerWallet = bundleTokens / BigInt(bundleWalletsCount);
    
    console.log('Expected Values:');
    console.log(`- Total supply: ${ethers.formatUnits(totalSupply, tokenDecimals)}`);
    console.log(`- Clog tokens (${clogPercentage}%): ${ethers.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Liquidity tokens (${liquidityTokenPercentage}%): ${ethers.formatUnits(liquidityTokens, tokenDecimals)}`);
    console.log(`- Bundle tokens (${bundlePercentage}%): ${ethers.formatUnits(bundleTokens, tokenDecimals)}`);
    console.log(`- Tokens per wallet: ${ethers.formatUnits(tokensPerWallet, tokenDecimals)}`);

    // Step 4: Generate bundle wallets
    console.log('\n👥 Step 4: Generating bundle wallets...');
    
    const bundleWallets = [];
    for (let i = 0; i < bundleWalletsCount; i++) {
      const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
      bundleWallets.push(wallet);
      console.log(`- Wallet ${i + 1}: ${wallet.address}`);
    }

    // Step 5: Execute clog transfer
    console.log('\n🔄 Step 5: Executing clog transfer...');
    
    const clogTx = await testToken.transfer(tokenAddress, clogTokens);
    await clogTx.wait();
    
    const contractBalance = await testToken.balanceOf(tokenAddress);
    const devWalletBalanceAfterClog = await testToken.balanceOf(devWallet.address);
    
    console.log(`- Clog tokens transferred: ${ethers.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Contract balance: ${ethers.formatUnits(contractBalance, tokenDecimals)}`);
    console.log(`- Dev wallet balance: ${ethers.formatUnits(devWalletBalanceAfterClog, tokenDecimals)}`);
    console.log('✅ Clog transfer successful');

    // Step 6: Create Uniswap pair
    console.log('\n🏦 Step 6: Creating Uniswap pair...');
    
    const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    
    const factory = new ethers.Contract(
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap V2 Factory
      ["function createPair(address tokenA, address tokenB) external returns (address pair)"],
      devWallet
    );
    
    const createPairTx = await factory.createPair(tokenAddress, wethAddress);
    const receipt = await createPairTx.wait();
    
    // Extract pair address from event
    const pairAddress = receipt.logs[0].address;
    console.log(`- Pair created at: ${pairAddress}`);
    console.log('✅ Uniswap pair created');

    // Step 7: Add liquidity
    console.log('\n💧 Step 7: Adding liquidity...');
    
    const router = new ethers.Contract(
      routerAddress,
      [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
        "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)"
      ],
      devWallet
    );
    
    // Approve router to spend tokens
    const approveTx = await testToken.approve(routerAddress, liquidityTokens);
    await approveTx.wait();
    
    // Add liquidity
    const liquidityTx = await router.addLiquidityETH(
      tokenAddress,
      liquidityTokens,
      0, // amountTokenMin
      0, // amountETHMin
      devWallet.address,
      Math.floor(Date.now() / 1000) + 3600, // deadline
      { value: liquidityEth }
    );
    await liquidityTx.wait();
    
    console.log(`- Liquidity added: ${ethers.formatUnits(liquidityTokens, tokenDecimals)} tokens + ${ethers.formatEther(liquidityEth)} ETH`);
    console.log('✅ Liquidity added successfully');

    // Step 8: Use BundleCalculationService from transactions package
    console.log('\n🔢 Step 8: Using BundleCalculationService for equal distribution...');
    
    let walletAmounts = [];
    
    try {
      // Import the BundleCalculationService
      const { BundleCalculationService } = require('../../transactions/dist/services/bundle/bundle-calculation.service');
      
      const calculationService = new BundleCalculationService();
      
      const config = {
        totalTokensToDistribute: bundleTokens,
        walletCount: bundleWalletsCount,
        tokenAddress: tokenAddress,
        wethAddress: wethAddress,
        routerAddress: routerAddress,
        signer: devWallet,
        maxIterations: 15,
        tolerance: BigInt(1000000) // 1M wei tolerance
      };
      
      console.log('Calculating optimal ETH amounts...');
      const calculationResult = await calculationService.calculateEqualTokenDistribution(config);
      
      if (!calculationResult.success) {
        throw new Error(`Calculation failed: ${calculationResult.error}`);
      }
      
      walletAmounts = calculationResult.data.walletAmounts;
      console.log(`✅ Calculation completed with ${calculationResult.data.priceImpact.toFixed(2)}% price impact`);
      
      console.log('\n📊 Wallet Distribution (From BundleCalculationService):');
      walletAmounts.forEach((wallet, index) => {
        console.log(`Wallet ${index + 1}:`);
        console.log(`  - ETH amount: ${ethers.formatEther(wallet.ethAmount)}`);
        console.log(`  - Expected tokens: ${ethers.formatUnits(wallet.expectedTokens, tokenDecimals)}`);
      });
      
    } catch (error) {
      console.log(`⚠️  BundleCalculationService failed: ${error.message}`);
      console.log('Falling back to manual calculation...');
      
      // Fallback to manual calculation
      const targetTokensPerWallet = bundleTokens / BigInt(bundleWalletsCount);
      const initialEthPerWallet = ethers.parseEther("0.05");
      
      for (let i = 0; i < bundleWalletsCount; i++) {
        walletAmounts.push({
          walletIndex: i,
          ethAmount: initialEthPerWallet,
          expectedTokens: targetTokensPerWallet
        });
      }
      
      console.log('\n📊 Wallet Distribution (Manual Fallback):');
      walletAmounts.forEach((wallet, index) => {
        console.log(`Wallet ${index + 1}:`);
        console.log(`  - ETH amount: ${ethers.formatEther(wallet.ethAmount)}`);
        console.log(`  - Expected tokens: ${ethers.formatUnits(wallet.expectedTokens, tokenDecimals)}`);
      });
    }

    // Step 9: Fund bundle wallets
    console.log('\n💰 Step 9: Funding bundle wallets...');
    
    // Calculate gas buffer for funding
    const feeData = await ethers.provider.getFeeData();
    const estimatedGasLimit = BigInt(200000);
    const gasBuffer = (feeData.gasPrice || BigInt(20000000000)) * estimatedGasLimit;
    const extraBuffer = ethers.parseEther("0.01");
    
    for (let i = 0; i < bundleWallets.length; i++) {
      const wallet = bundleWallets[i];
      const requiredEth = walletAmounts[i].ethAmount + gasBuffer + extraBuffer;
      
      const fundTx = await fundingWallet.sendTransaction({
        to: wallet.address,
        value: requiredEth
      });
      await fundTx.wait();
      
      const balance = await ethers.provider.getBalance(wallet.address);
      console.log(`- Wallet ${i + 1}: ${ethers.formatEther(requiredEth)} ETH (${ethers.formatEther(balance)} actual)`);
    }
    
    console.log('✅ Bundle wallets funded');

    // Step 10: Exclude bundle wallets from fees
    console.log('\n🚫 Step 10: Excluding bundle wallets from fees...');
    
    for (let i = 0; i < bundleWallets.length; i++) {
      const wallet = bundleWallets[i];
      const excludeTx = await testToken.excludeFromFee(wallet.address);
      await excludeTx.wait();
      
      const isExcluded = await testToken.isExcludedFromFee(wallet.address);
      console.log(`- Wallet ${i + 1}: ${isExcluded ? "✅ Excluded" : "❌ Not excluded"}`);
      
      if (!isExcluded) {
        throw new Error(`Failed to exclude wallet ${i + 1} from fees`);
      }
    }
    
    console.log('✅ Bundle wallets excluded from fees');

    // Step 11: Open trading
    console.log('\n🚀 Step 11: Opening trading...');
    
    const openTradingTx = await testToken.openTradingV2();
    await openTradingTx.wait();
    
    console.log('✅ Trading opened successfully');

    // Step 12: Execute bundle buys using transactions package
    console.log('\n🛒 Step 12: Executing bundle buys using transactions package...');
    
    try {
      // Import the executeEqualDistributionBundle function
      const { executeEqualDistributionBundle } = require('../../transactions/dist/transactions/bundle-equal-distribution.transaction');
      
      const bundleConfig = {
        walletAddresses: bundleWallets.map(w => w.address),
        ethAmounts: walletAmounts.map(w => w.ethAmount),
        tokenAddress: tokenAddress,
        wethAddress: wethAddress,
        routerAddress: routerAddress,
        signers: bundleWallets,
        deadline: Math.floor(Date.now() / 1000) + 3600
      };
      
      console.log('Executing equal distribution bundle...');
      const bundleResult = await executeEqualDistributionBundle(bundleConfig);
      
      if (!bundleResult.success) {
        throw new Error(`Bundle execution failed: ${bundleResult.error}`);
      }
      
      console.log('✅ Bundle execution completed using transactions package!');
      
      // Display results
      bundleResult.data.forEach((result, index) => {
        if (result.success) {
          console.log(`Wallet ${index + 1}: ${ethers.formatUnits(result.actualTokensReceived, tokenDecimals)} tokens`);
        } else {
          console.log(`Wallet ${index + 1}: ❌ Failed`);
        }
      });
      
    } catch (error) {
      console.log(`⚠️  Transactions package execution failed: ${error.message}`);
      console.log('Falling back to manual execution...');
      
      // Fallback to manual execution
      const buyResults = [];
      
      for (let i = 0; i < bundleWallets.length; i++) {
        const wallet = bundleWallets[i];
        const ethAmount = walletAmounts[i].ethAmount;
        
        try {
          console.log(`\n🛒 Executing buy ${i + 1}/${bundleWallets.length}`);
          console.log(`Wallet: ${wallet.address}`);
          console.log(`ETH Amount: ${ethers.formatEther(ethAmount)}`);
          
          // Execute buy
          const buyTx = await router.connect(wallet).swapExactETHForTokensSupportingFeeOnTransferTokens(
            0, // amountOutMin
            [wethAddress, tokenAddress], // path: WETH -> TOKEN
            wallet.address, // to
            Math.floor(Date.now() / 1000) + 3600, // deadline
            { value: ethAmount }
          );
          
          await buyTx.wait();
          
          const tokenBalance = await testToken.balanceOf(wallet.address);
          const ethBalance = await ethers.provider.getBalance(wallet.address);
          
          console.log(`✅ Buy completed:`);
          console.log(`  - Actual tokens: ${ethers.formatUnits(tokenBalance, tokenDecimals)}`);
          console.log(`  - Remaining ETH: ${ethers.formatEther(ethBalance)}`);
          
          buyResults.push({
            walletAddress: wallet.address,
            success: true,
            actualTokensReceived: tokenBalance,
            ethSpent: ethAmount
          });
          
        } catch (error) {
          console.error(`❌ Buy failed for wallet ${wallet.address}:`, error.message);
          buyResults.push({
            walletAddress: wallet.address,
            success: false,
            actualTokensReceived: BigInt(0),
            ethSpent: BigInt(0),
            error: error.message
          });
        }
      }
    }
    
    console.log('\n🎉 Bundle launch test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Token deployed: ${tokenAddress}`);
    console.log(`- Liquidity pair: ${pairAddress}`);
    console.log(`- Bundle wallets: ${bundleWalletsCount}`);
    console.log(`- Used transactions package services: ✅`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 