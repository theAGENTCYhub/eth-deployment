const { ethers } = require('hardhat');
const { 
  BundleCalculationService,
  executeEqualDistributionBundle 
} = require('@eth-deployer/transactions');

async function main() {
  console.log('🚀 Starting Deploy and Bundle Launch Test (Equal Distribution)...\n');

  try {
    // Get signers
    const [devWallet, fundingWallet] = await ethers.getSigners();
    
    console.log('📡 Network Info:');
    console.log(`- Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
    console.log(`- Network: ${(await ethers.provider.getNetwork()).name}`);
    
    console.log('\n👤 Wallet Addresses:');
    console.log(`- Dev wallet: ${devWallet.address}`);
    console.log(`- Funding wallet: ${fundingWallet.address}`);

    // Step 1: Deploy TestERC20 contract
    console.log('\n🏗️  Step 1: Deploying TestERC20 contract...');
    
    const TestERC20 = await ethers.getContractFactory('TestERC20');
    const testToken = await TestERC20.deploy();
    await testToken.deployed();
    
    const tokenAddress = testToken.address;
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
    console.log(`- Total Supply: ${ethers.utils.formatUnits(tokenTotalSupply, tokenDecimals)} ${tokenSymbol}`);

    // Check initial balances
    const devWalletBalance = await ethers.provider.getBalance(devWallet.address);
    const fundingWalletBalance = await ethers.provider.getBalance(fundingWallet.address);
    const devWalletTokenBalance = await testToken.balanceOf(devWallet.address);
    
    console.log('\n💰 Initial Balances:');
    console.log(`- Dev wallet ETH: ${ethers.utils.formatEther(devWalletBalance)}`);
    console.log(`- Dev wallet tokens: ${ethers.utils.formatUnits(devWalletTokenBalance, tokenDecimals)}`);
    console.log(`- Funding wallet ETH: ${ethers.utils.formatEther(fundingWalletBalance)}`);
    
    if (devWalletTokenBalance.eq(tokenTotalSupply)) {
      console.log('✅ Dev wallet owns all tokens');
    } else {
      throw new Error('Dev wallet does not own all tokens');
    }

    // Step 2: Configure bundle launch parameters
    console.log('\n⚙️  Step 2: Configuring bundle launch parameters...');
    
    const bundleWalletsCount = 5;
    const bundlePercentage = 10; // 10% of total supply
    const liquidityEth = ethers.utils.parseEther("10.0"); // 10 ETH
    const liquidityTokenPercentage = 90; // 90% of total supply
    const clogPercentage = 10; // 10% of total supply
    
    console.log('Bundle Configuration:');
    console.log(`- Token: ${tokenName} (${tokenAddress})`);
    console.log(`- Bundle wallets: ${bundleWalletsCount}`);
    console.log(`- Bundle percentage: ${bundlePercentage}%`);
    console.log(`- Liquidity ETH: ${ethers.utils.formatEther(liquidityEth)}`);
    console.log(`- Liquidity token %: ${liquidityTokenPercentage}%`);
    console.log(`- Clog percentage: ${clogPercentage}%`);

    // Step 3: Calculate expected values
    console.log('\n🧮 Step 3: Calculating expected values...');
    
    const totalSupply = tokenTotalSupply;
    const clogTokens = totalSupply.mul(clogPercentage).div(100);
    const liquidityTokens = totalSupply.mul(liquidityTokenPercentage).div(100);
    const bundleTokens = totalSupply.mul(bundlePercentage).div(100);
    const tokensPerWallet = bundleTokens.div(bundleWalletsCount);
    
    console.log('Expected Values:');
    console.log(`- Total supply: ${ethers.utils.formatUnits(totalSupply, tokenDecimals)}`);
    console.log(`- Clog tokens (${clogPercentage}%): ${ethers.utils.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Liquidity tokens (${liquidityTokenPercentage}%): ${ethers.utils.formatUnits(liquidityTokens, tokenDecimals)}`);
    console.log(`- Bundle tokens (${bundlePercentage}%): ${ethers.utils.formatUnits(bundleTokens, tokenDecimals)}`);
    console.log(`- Tokens per wallet: ${ethers.utils.formatUnits(tokensPerWallet, tokenDecimals)}`);

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
    
    const clogTx = await testToken.transfer(testToken.address, clogTokens);
    await clogTx.wait();
    
    const contractBalance = await testToken.balanceOf(testToken.address);
    const devWalletBalanceAfterClog = await testToken.balanceOf(devWallet.address);
    
    console.log(`- Clog tokens transferred: ${ethers.utils.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Contract balance: ${ethers.utils.formatUnits(contractBalance, tokenDecimals)}`);
    console.log(`- Dev wallet balance: ${ethers.utils.formatUnits(devWalletBalanceAfterClog, tokenDecimals)}`);
    console.log('✅ Clog transfer successful');

    // Step 6: Create Uniswap pair
    console.log('\n🏦 Step 6: Creating Uniswap pair...');
    
    const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    
    const routerABI = [
      'function factory() external pure returns (address)',
      'function WETH() external pure returns (address)',
      'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)'
    ];
    
    const router = new ethers.Contract(routerAddress, routerABI, devWallet);
    const factoryAddress = await router.factory();
    
    const factoryABI = [
      'function createPair(address tokenA, address tokenB) external returns (address pair)'
    ];
    const factory = new ethers.Contract(factoryAddress, factoryABI, devWallet);
    
    const pairTx = await factory.createPair(tokenAddress, wethAddress);
    const pairReceipt = await pairTx.wait();
    
    // Extract pair address from event
    const pairCreatedEvent = pairReceipt.events?.find(e => e.event === 'PairCreated');
    const pairAddress = pairCreatedEvent?.args?.pair;
    
    console.log(`- Pair created at: ${pairAddress}`);
    console.log('✅ Uniswap pair created');

    // Step 7: Add liquidity
    console.log('\n💧 Step 7: Adding liquidity...');
    
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
    
    console.log(`- Liquidity added: ${ethers.utils.formatUnits(liquidityTokens, tokenDecimals)} tokens + ${ethers.utils.formatEther(liquidityEth)} ETH`);
    console.log('✅ Liquidity added successfully');

    // Step 8: Calculate equal distribution using BundleCalculationService
    console.log('\n🔢 Step 8: Calculating equal token distribution...');
    
    const calculationService = new BundleCalculationService();
    
    const calculationConfig = {
      totalTokensToDistribute: BigInt(bundleTokens.toString()),
      walletCount: bundleWalletsCount,
      tokenAddress: tokenAddress,
      wethAddress: wethAddress,
      routerAddress: routerAddress,
      signer: devWallet,
      maxIterations: 10,
      tolerance: BigInt(ethers.utils.parseUnits('1000', tokenDecimals).toString())
    };
    
    const calculationResult = await calculationService.calculateEqualTokenDistribution(calculationConfig);
    
    if (!calculationResult.success || !calculationResult.data) {
      throw new Error(`Calculation failed: ${calculationResult.error}`);
    }
    
    const { walletAmounts, totalEthRequired, averageEthPerWallet, priceImpact } = calculationResult.data;
    
    console.log('\n✅ Equal Distribution Calculation:');
    console.log(`- Total ETH required: ${ethers.utils.formatEther(totalEthRequired)}`);
    console.log(`- Average ETH per wallet: ${ethers.utils.formatEther(averageEthPerWallet)}`);
    console.log(`- Price impact: ${priceImpact.toFixed(2)}%`);
    
    console.log('\n📊 Wallet Distribution:');
    walletAmounts.forEach((wallet, index) => {
      console.log(`Wallet ${index + 1}:`);
      console.log(`  - ETH amount: ${ethers.utils.formatEther(wallet.ethAmount)}`);
      console.log(`  - Expected tokens: ${ethers.utils.formatUnits(wallet.expectedTokens, tokenDecimals)}`);
    });

    // Step 9: Fund bundle wallets with calculated amounts
    console.log('\n💰 Step 9: Funding bundle wallets...');
    
    // Calculate gas buffer for funding
    const feeData = await ethers.provider.getFeeData();
    const estimatedGasLimit = BigInt(200000);
    const gasBuffer = (feeData.gasPrice || BigInt(20000000000)) * estimatedGasLimit;
    const extraBuffer = ethers.utils.parseEther("0.01");
    
    for (let i = 0; i < bundleWallets.length; i++) {
      const wallet = bundleWallets[i];
      const requiredEth = walletAmounts[i].ethAmount + gasBuffer + extraBuffer;
      
      const fundTx = await fundingWallet.sendTransaction({
        to: wallet.address,
        value: requiredEth
      });
      await fundTx.wait();
      
      const balance = await ethers.provider.getBalance(wallet.address);
      console.log(`- Wallet ${i + 1}: ${ethers.utils.formatEther(requiredEth)} ETH (${ethers.utils.formatEther(balance)} actual)`);
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

    // Step 12: Execute equal distribution bundle
    console.log('\n🛒 Step 12: Executing equal distribution bundle...');
    
    const bundleConfig = {
      walletAddresses: bundleWallets.map(w => w.address),
      ethAmounts: walletAmounts.map(w => w.ethAmount),
      expectedTokens: walletAmounts.map(w => w.expectedTokens),
      tokenAddress: tokenAddress,
      wethAddress: wethAddress,
      routerAddress: routerAddress,
      signer: devWallet
    };
    
    const bundleResult = await executeEqualDistributionBundle(bundleConfig);
    
    if (!bundleResult.success) {
      throw new Error(`Bundle execution failed: ${bundleResult.error}`);
    }
    
    console.log('\n✅ Bundle execution completed!');
    
    // Step 13: Verify results
    console.log('\n📊 Step 13: Verifying results...');
    
    const successfulBuys = bundleResult.data.filter(r => r.success).length;
    const totalBuys = bundleResult.data.length;
    
    console.log(`\n🎯 Bundle Results: ${successfulBuys}/${totalBuys} successful`);
    
    let totalTokensBought = BigInt(0);
    bundleResult.data.forEach((buy, index) => {
      if (buy.success) {
        console.log(`Wallet ${index + 1}: ${ethers.utils.formatUnits(buy.actualTokensReceived, tokenDecimals)} tokens`);
        totalTokensBought += buy.actualTokensReceived;
      } else {
        console.log(`Wallet ${index + 1}: ❌ Failed - ${buy.error}`);
      }
    });
    
    // Check final balances
    const devWalletBalanceAfter = await ethers.provider.getBalance(devWallet.address);
    const fundingWalletBalanceAfter = await ethers.provider.getBalance(fundingWallet.address);
    const contractTokenBalanceFinal = await testToken.balanceOf(tokenAddress);
    
    console.log('\n💰 Final Balances:');
    console.log(`- Dev wallet ETH: ${ethers.utils.formatEther(devWalletBalanceAfter)} (spent: ${ethers.utils.formatEther(devWalletBalance.sub(devWalletBalanceAfter))})`);
    console.log(`- Funding wallet ETH: ${ethers.utils.formatEther(fundingWalletBalanceAfter)} (spent: ${ethers.utils.formatEther(fundingWalletBalance.sub(fundingWalletBalanceAfter))})`);
    console.log(`- Contract tokens (clog): ${ethers.utils.formatUnits(contractTokenBalanceFinal, tokenDecimals)}`);
    console.log(`- Total tokens bought: ${ethers.utils.formatUnits(totalTokensBought, tokenDecimals)}`);
    
    // Validate equal distribution
    console.log('\n🔍 Equal Distribution Validation:');
    const targetTokensPerWallet = bundleTokens.div(bundleWalletsCount);
    let allEqual = true;
    
    bundleResult.data.forEach((buy, index) => {
      if (buy.success) {
        const difference = buy.actualTokensReceived > targetTokensPerWallet 
          ? buy.actualTokensReceived - targetTokensPerWallet
          : targetTokensPerWallet - buy.actualTokensReceived;
        const percentageDiff = Number((difference * BigInt(10000)) / targetTokensPerWallet) / 100;
        
        console.log(`Wallet ${index + 1}: ${percentageDiff.toFixed(2)}% difference from target`);
        
        if (percentageDiff > 5) { // More than 5% difference
          allEqual = false;
        }
      }
    });
    
    if (allEqual) {
      console.log('✅ All wallets received approximately equal tokens!');
    } else {
      console.log('⚠️  Some wallets received significantly different amounts');
    }
    
    console.log('\n🎉 Equal distribution bundle launch test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Token deployed: ${tokenAddress}`);
    console.log(`- Liquidity pair: ${pairAddress}`);
    console.log(`- Bundle wallets: ${bundleWalletsCount}`);
    console.log(`- Total ETH spent: ${ethers.utils.formatEther(devWalletBalance.sub(devWalletBalanceAfter).add(fundingWalletBalance.sub(fundingWalletBalanceAfter)))}`);
    console.log(`- Total tokens bought: ${ethers.utils.formatUnits(totalTokensBought, tokenDecimals)}`);
    console.log(`- Equal distribution: ${allEqual ? '✅ Success' : '⚠️  Partial'}`);

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