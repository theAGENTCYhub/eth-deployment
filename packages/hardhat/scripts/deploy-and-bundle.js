const { ethers } = require("hardhat");
const { 
  BundleOrchestrationService, 
  BundleCreationService, 
  BundleService, 
  LaunchService 
} = require("@eth-deployer/transactions");
const { registerContractAddress } = require("@eth-deployer/transactions/dist/contracts/contract-store");

async function main() {
  console.log("🚀 Starting Deploy and Bundle Launch Test...\n");
  
  try {
    // Get signers (hardhat accounts)
    const [devWallet, fundingWallet] = await ethers.getSigners();
    
    console.log("📡 Network Info:");
    const network = await ethers.provider.getNetwork();
    console.log(`- Chain ID: ${network.chainId}`);
    console.log(`- Network: ${network.name}`);
    
    console.log("\n👤 Wallet Addresses:");
    console.log(`- Dev wallet: ${devWallet.address}`);
    console.log(`- Funding wallet: ${fundingWallet.address}`);
    
    // Step 1: Deploy TestERC20 contract
    console.log("\n🏗️  Step 1: Deploying TestERC20 contract...");
    const TestERC20 = await ethers.getContractFactory("TOKEN");
    const testToken = await TestERC20.deploy();
    await testToken.waitForDeployment();
    
    const tokenAddress = await testToken.getAddress();
    console.log(`✅ Token deployed at: ${tokenAddress}`);
    
    // Get token info
    const tokenName = await testToken.name();
    const tokenSymbol = await testToken.symbol();
    const tokenDecimals = await testToken.decimals();
    const tokenTotalSupply = await testToken.totalSupply();
    
    console.log("\n🪙 Token Info:");
    console.log(`- Name: ${tokenName}`);
    console.log(`- Symbol: ${tokenSymbol}`);
    console.log(`- Decimals: ${tokenDecimals}`);
    console.log(`- Total Supply: ${ethers.formatUnits(tokenTotalSupply, tokenDecimals)} ${tokenSymbol}`);
    
    // Get initial balances
    const devWalletBalance = await ethers.provider.getBalance(devWallet.address);
    const fundingWalletBalance = await ethers.provider.getBalance(fundingWallet.address);
    const devWalletTokenBalance = await testToken.balanceOf(devWallet.address);
    
    console.log("\n💰 Initial Balances:");
    console.log(`- Dev wallet ETH: ${ethers.formatEther(devWalletBalance)}`);
    console.log(`- Dev wallet tokens: ${ethers.formatUnits(devWalletTokenBalance, tokenDecimals)}`);
    console.log(`- Funding wallet ETH: ${ethers.formatEther(fundingWalletBalance)}`);
    
    // Verify dev wallet owns all tokens
    if (devWalletTokenBalance.toString() !== tokenTotalSupply.toString()) {
      throw new Error("Dev wallet does not own all tokens");
    }
    console.log("✅ Dev wallet owns all tokens");
    
    // Step 2: Configure bundle launch parameters
    console.log("\n⚙️  Step 2: Configuring bundle launch parameters...");
    
    const BUNDLE_CONFIG = {
      tokenAddress: tokenAddress,
      tokenName: tokenName,
      tokenTotalSupply: tokenTotalSupply.toString(),
      devWalletAddress: devWallet.address,
      fundingWalletAddress: fundingWallet.address,
      bundle_wallet_count: 5,
      bundle_token_percent: 10, // 10% of supply
      bundle_token_percent_per_wallet: 2, // 10% / 5 wallets = 2% per wallet
      liquidity_eth_amount: ethers.parseEther("10").toString(), // 10 ETH
      liquidity_token_percent: 90, // 90% to liquidity (10% clog)
    };
    
    console.log("Bundle Configuration:");
    console.log(`- Token: ${tokenName} (${tokenAddress})`);
    console.log(`- Bundle wallets: ${BUNDLE_CONFIG.bundle_wallet_count}`);
    console.log(`- Bundle percentage: ${BUNDLE_CONFIG.bundle_token_percent}%`);
    console.log(`- Liquidity ETH: ${ethers.formatEther(BUNDLE_CONFIG.liquidity_eth_amount)}`);
    console.log(`- Liquidity token %: ${BUNDLE_CONFIG.liquidity_token_percent}%`);
    console.log(`- Clog percentage: ${100 - BUNDLE_CONFIG.liquidity_token_percent}%`);
    
    // Step 3: Register contract addresses for the transactions package
    console.log("\n🏗️  Step 3: Registering contract addresses...");
    
    // Register Uniswap addresses for hardhat network
    registerContractAddress("UniswapV2Factory", "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", "hardhat");
    registerContractAddress("UniswapV2Router02", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", "hardhat");
    registerContractAddress("WETH", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "hardhat");
    
    console.log("✅ Contract addresses registered");
    
    // Step 4: Initialize bundle services
    console.log("\n⚙️  Step 4: Initializing bundle services...");
    
    const bundleOrchestrationService = new BundleOrchestrationService(
      ethers.provider,
      devWallet.privateKey,
      fundingWallet.privateKey
    );
    
    const bundleCreationService = new BundleCreationService(ethers.provider, "hardhat");
    const bundleService = new BundleService(
      ethers.provider,
      "hardhat",
      devWallet.privateKey,
      fundingWallet.privateKey
    );
    
    const launchService = new LaunchService(ethers.provider);
    
    console.log("✅ Bundle services initialized");
    
    // Step 5: Get launch estimation
    console.log("\n🧮 Step 5: Getting launch estimation...");
    
    const estimateResult = await launchService.estimateLaunch(BUNDLE_CONFIG);
    if (!estimateResult.success || !estimateResult.data) {
      throw new Error(`Launch estimation failed: ${estimateResult.error}`);
    }
    
    const estimation = estimateResult.data;
    console.log("Launch Estimation:");
    console.log(`- Initial liquidity ETH: ${ethers.formatEther(estimation.initialLiquidityEth || '0')}`);
    console.log(`- Bundle buy ETH: ${ethers.formatEther(estimation.bundleBuyEth || '0')}`);
    console.log(`- Gas padding ETH: ${ethers.formatEther(estimation.gasPaddingEth || '0')}`);
    console.log(`- Total required ETH: ${ethers.formatEther(estimation.totalEthRequired || '0')}`);
    console.log(`- Expected price impact: ${estimation.expectedPriceImpact?.toFixed(4) || '0'}%`);
    console.log(`- Tokens per wallet: ${ethers.formatUnits(estimation.tokensPerWallet || '0', tokenDecimals)}`);
    
    // Calculate expected values for comparison
    const totalSupply = ethers.BigNumber.from(tokenTotalSupply);
    const clogTokens = totalSupply.mul(100 - BUNDLE_CONFIG.liquidity_token_percent).div(100);
    const liquidityTokens = totalSupply.sub(clogTokens);
    const bundleTokens = totalSupply.mul(BUNDLE_CONFIG.bundle_token_percent).div(100);
    const tokensPerWallet = bundleTokens.div(BUNDLE_CONFIG.bundle_wallet_count);
    
    console.log("\n📊 Expected Values:");
    console.log(`- Clog tokens: ${ethers.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Liquidity tokens: ${ethers.formatUnits(liquidityTokens, tokenDecimals)}`);
    console.log(`- Bundle tokens: ${ethers.formatUnits(bundleTokens, tokenDecimals)}`);
    console.log(`- Tokens per wallet: ${ethers.formatUnits(tokensPerWallet, tokenDecimals)}`);
    
    // Step 6: Orchestrate bundle (without execution)
    console.log("\n🏗️  Step 6: Orchestrating bundle...");
    
    const orchestrationResult = await bundleOrchestrationService.orchestrateBundleLaunch(BUNDLE_CONFIG);
    if (!orchestrationResult.success || !orchestrationResult.data) {
      throw new Error(`Bundle orchestration failed: ${orchestrationResult.error}`);
    }
    
    const bundleWallets = orchestrationResult.data.bundleWallets;
    console.log(`✅ Generated ${bundleWallets.length} bundle wallets`);
    
    // Display bundle wallet addresses
    bundleWallets.forEach((wallet, index) => {
      console.log(`- Wallet ${index + 1}: ${wallet.address}`);
    });
    
    // Step 7: Create bundle
    console.log("\n📦 Step 7: Creating bundle...");
    
    const bundleResult = await bundleCreationService.createBundle(
      orchestrationResult.data,
      {
        network: "hardhat",
        maxGasPrice: ethers.parseUnits("50", "gwei").toString(),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei").toString(),
        maxFeePerGas: ethers.parseUnits("52", "gwei").toString(),
      }
    );
    
    if (!bundleResult.success || !bundleResult.data) {
      throw new Error(`Bundle creation failed: ${bundleResult.error}`);
    }
    
    console.log("Bundle created:");
    console.log(`- Type: ${bundleResult.data.type}`);
    if (bundleResult.data.type === 'sequential') {
      console.log(`- Transactions: ${bundleResult.data.transactions.length}`);
    }
    console.log(`- Estimated cost: ${ethers.formatEther(bundleResult.data.estimatedCost || '0')} ETH`);
    
    // Step 8: Execute bundle launch
    console.log("\n🚀 Step 8: Executing bundle launch...");
    
    const launchResult = await bundleService.launchBundle({
      config: BUNDLE_CONFIG,
      network: "hardhat",
      devWalletPrivateKey: devWallet.privateKey,
      fundingWalletPrivateKey: fundingWallet.privateKey,
    });
    
    if (!launchResult.success) {
      throw new Error(`Bundle launch failed: ${launchResult.error}`);
    }
    
    console.log("✅ Bundle launch executed successfully!");
    
    // Step 9: Verify results
    console.log("\n📊 Step 9: Verifying results...");
    
    // Get final balances
    const devWalletBalanceAfter = await ethers.provider.getBalance(devWallet.address);
    const fundingWalletBalanceAfter = await ethers.provider.getBalance(fundingWallet.address);
    const devWalletTokenBalanceAfter = await testToken.balanceOf(devWallet.address);
    const contractTokenBalance = await testToken.balanceOf(tokenAddress);
    
    console.log("\n💰 Final Balances:");
    console.log(`- Dev wallet ETH: ${ethers.formatEther(devWalletBalanceAfter)} (spent: ${ethers.formatEther(devWalletBalance.sub(devWalletBalanceAfter))})`);
    console.log(`- Dev wallet tokens: ${ethers.formatUnits(devWalletTokenBalanceAfter, tokenDecimals)}`);
    console.log(`- Funding wallet ETH: ${ethers.formatEther(fundingWalletBalanceAfter)} (spent: ${ethers.formatEther(fundingWalletBalance.sub(fundingWalletBalanceAfter))})`);
    console.log(`- Contract tokens (clog): ${ethers.formatUnits(contractTokenBalance, tokenDecimals)}`);
    
    // Check bundle wallet results
    console.log("\n👥 Bundle Wallet Results:");
    let totalTokensBought = ethers.BigNumber.from(0);
    for (let i = 0; i < bundleWallets.length; i++) {
      const wallet = bundleWallets[i];
      const tokenBalance = await testToken.balanceOf(wallet.address);
      const ethBalance = await ethers.provider.getBalance(wallet.address);
      
      totalTokensBought = totalTokensBought.add(tokenBalance);
      
      console.log(`- Wallet ${i + 1}: ${ethers.formatUnits(tokenBalance, tokenDecimals)} tokens, ${ethers.formatEther(ethBalance)} ETH`);
    }
    
    // Step 10: Summary and validation
    console.log("\n📈 Final Comparison:");
    console.log("=" .repeat(60));
    console.log(`- Expected clog tokens: ${ethers.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Actual clog tokens: ${ethers.formatUnits(contractTokenBalance, tokenDecimals)}`);
    console.log(`- Expected tokens per wallet: ${ethers.formatUnits(tokensPerWallet, tokenDecimals)}`);
    console.log(`- Total tokens bought: ${ethers.formatUnits(totalTokensBought, tokenDecimals)}`);
    
    // Validation checks
    const clogAccuracy = contractTokenBalance.eq(clogTokens);
    const bundleSuccess = totalTokensBought.gt(0);
    
    console.log("\n✅ Validation Results:");
    console.log(`- Clog transfer accuracy: ${clogAccuracy ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Bundle execution success: ${bundleSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    if (clogAccuracy && bundleSuccess) {
      console.log("\n🎉 Bundle launch test completed successfully!");
    } else {
      console.log("\n⚠️  Bundle launch test completed with issues");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
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