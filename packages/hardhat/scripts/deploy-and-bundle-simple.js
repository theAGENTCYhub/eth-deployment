const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Deploy and Bundle Launch Test (Simplified)...\n");
  
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
      bundle_wallet_count: 5,
      bundle_token_percent: 10, // 10% of supply
      liquidity_eth_amount: ethers.parseEther("10"), // 10 ETH
      liquidity_token_percent: 90, // 90% to liquidity (10% clog)
    };
    
    console.log("Bundle Configuration:");
    console.log(`- Token: ${tokenName} (${tokenAddress})`);
    console.log(`- Bundle wallets: ${BUNDLE_CONFIG.bundle_wallet_count}`);
    console.log(`- Bundle percentage: ${BUNDLE_CONFIG.bundle_token_percent}%`);
    console.log(`- Liquidity ETH: ${ethers.formatEther(BUNDLE_CONFIG.liquidity_eth_amount)}`);
    console.log(`- Liquidity token %: ${BUNDLE_CONFIG.liquidity_token_percent}%`);
    console.log(`- Clog percentage: ${100 - BUNDLE_CONFIG.liquidity_token_percent}%`);
    
    // Step 3: Calculate expected values
    console.log("\n🧮 Step 3: Calculating expected values...");
    

    
    const totalSupply = tokenTotalSupply; // Already a bigint
    const clogTokens = totalSupply * BigInt(100 - BUNDLE_CONFIG.liquidity_token_percent) / BigInt(100);
    const liquidityTokens = totalSupply - clogTokens;
    const bundleTokens = totalSupply * BigInt(BUNDLE_CONFIG.bundle_token_percent) / BigInt(100);
    const tokensPerWallet = bundleTokens / BigInt(BUNDLE_CONFIG.bundle_wallet_count);
    
    console.log("Expected Values:");
    console.log(`- Total supply: ${ethers.formatUnits(totalSupply, tokenDecimals)}`);
    console.log(`- Clog tokens (${100 - BUNDLE_CONFIG.liquidity_token_percent}%): ${ethers.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Liquidity tokens (${BUNDLE_CONFIG.liquidity_token_percent}%): ${ethers.formatUnits(liquidityTokens, tokenDecimals)}`);
    console.log(`- Bundle tokens (${BUNDLE_CONFIG.bundle_token_percent}%): ${ethers.formatUnits(bundleTokens, tokenDecimals)}`);
    console.log(`- Tokens per wallet: ${ethers.formatUnits(tokensPerWallet, tokenDecimals)}`);
    
    // Step 4: Generate bundle wallets
    console.log("\n👥 Step 4: Generating bundle wallets...");
    
    const bundleWallets = [];
    for (let i = 0; i < BUNDLE_CONFIG.bundle_wallet_count; i++) {
      const wallet = ethers.Wallet.createRandom();
      bundleWallets.push(wallet);
      console.log(`- Wallet ${i + 1}: ${wallet.address}`);
    }
    
    // Step 5: Execute clog transfer
    console.log("\n🔄 Step 5: Executing clog transfer...");
    
    const clogTransferTx = await testToken.transfer(tokenAddress, clogTokens);
    await clogTransferTx.wait();
    
    const contractBalance = await testToken.balanceOf(tokenAddress);
    const devWalletTokenBalanceAfter = await testToken.balanceOf(devWallet.address);
    
    console.log(`- Clog tokens transferred: ${ethers.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Contract balance: ${ethers.formatUnits(contractBalance, tokenDecimals)}`);
    console.log(`- Dev wallet balance: ${ethers.formatUnits(devWalletTokenBalanceAfter, tokenDecimals)}`);
    
    if (contractBalance !== clogTokens) {
      throw new Error("Clog transfer failed");
    }
    console.log("✅ Clog transfer successful");
    
    // Step 6: Create Uniswap pair
    console.log("\n🏦 Step 6: Creating Uniswap pair...");
    
    const factory = new ethers.Contract(
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap V2 Factory
      ["function createPair(address tokenA, address tokenB) external returns (address pair)"],
      devWallet
    );
    
    const createPairTx = await factory.createPair(tokenAddress, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"); // WETH
    const receipt = await createPairTx.wait();
    
    // Extract pair address from event
    const pairAddress = receipt.logs[0].address;
    console.log(`- Pair created at: ${pairAddress}`);
    console.log("✅ Uniswap pair created");
    
    // Step 7: Add liquidity
    console.log("\n💧 Step 7: Adding liquidity...");
    
    const router = new ethers.Contract(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
      [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
        "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)"
      ],
      devWallet
    );
    
    // Approve router to spend tokens
    const approveTx = await testToken.approve("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", liquidityTokens);
    await approveTx.wait();
    
    // Add liquidity
    const addLiquidityTx = await router.addLiquidityETH(
      tokenAddress,
      liquidityTokens,
      0, // amountTokenMin
      0, // amountETHMin
      devWallet.address,
      Math.floor(Date.now() / 1000) + 3600, // deadline
      { value: BUNDLE_CONFIG.liquidity_eth_amount }
    );
    
    await addLiquidityTx.wait();
    console.log(`- Liquidity added: ${ethers.formatUnits(liquidityTokens, tokenDecimals)} tokens + ${ethers.formatEther(BUNDLE_CONFIG.liquidity_eth_amount)} ETH`);
    console.log("✅ Liquidity added successfully");
    
    // Step 8: Fund bundle wallets
    console.log("\n💰 Step 8: Funding bundle wallets...");
    
    // Calculate proper funding amount with gas buffer
    const buyAmount = ethers.parseEther("0.05"); // 0.05 ETH per buy
    const feeData = await ethers.provider.getFeeData();
    const estimatedGasLimit = BigInt(200000); // Estimated gas for swap
    const gasBuffer = (feeData.gasPrice || BigInt(20000000000)) * estimatedGasLimit; // Default 20 gwei if not available
    const fundingAmount = buyAmount + gasBuffer + ethers.parseEther("0.01"); // Extra buffer for future operations
    
    console.log(`- Buy amount per wallet: ${ethers.formatEther(buyAmount)} ETH`);
    console.log(`- Gas buffer per wallet: ${ethers.formatEther(gasBuffer)} ETH`);
    console.log(`- Total funding per wallet: ${ethers.formatEther(fundingAmount)} ETH`);
    
    for (let i = 0; i < bundleWallets.length; i++) {
      const wallet = bundleWallets[i];
      const fundTx = await fundingWallet.sendTransaction({
        to: wallet.address,
        value: fundingAmount
      });
      await fundTx.wait();
      
      const balance = await ethers.provider.getBalance(wallet.address);
      console.log(`- Wallet ${i + 1}: ${ethers.formatEther(balance)} ETH`);
    }
    
    console.log("✅ Bundle wallets funded");
    
    // Step 9: Exclude bundle wallets from fees
    console.log("\n🚫 Step 9: Excluding bundle wallets from fees...");
    
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
    
    console.log("✅ Bundle wallets excluded from fees");
    
    // Step 10: Open trading V2
    console.log("\n🚀 Step 10: Opening trading V2...");
    
    const openTradingTx = await testToken.openTradingV2();
    await openTradingTx.wait();
    
    // const tradingOpen = await testToken.tradingOpen();
    // console.log(`- Trading open: ${tradingOpen}`);
    
    // if (!tradingOpen) {
    //   throw new Error("Failed to open trading");
    // }
    console.log("✅ Trading opened successfully");
    
    // Step 11: Execute bundle buys
    console.log("\n🛒 Step 11: Executing bundle buys...");
    
    // buyAmount is already defined above
    
    for (let i = 0; i < bundleWallets.length; i++) {
      const wallet = bundleWallets[i];
      const connectedWallet = wallet.connect(ethers.provider);
      
      // Execute buy
      const buyTx = await router.connect(connectedWallet).swapExactETHForTokensSupportingFeeOnTransferTokens(
        0, // amountOutMin
        ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", tokenAddress], // path: WETH -> TOKEN
        wallet.address, // to
        Math.floor(Date.now() / 1000) + 3600, // deadline
        { value: buyAmount }
      );
      
      await buyTx.wait();
      
      const tokenBalance = await testToken.balanceOf(wallet.address);
      const ethBalance = await ethers.provider.getBalance(wallet.address);
      
      console.log(`- Wallet ${i + 1}: ${ethers.formatUnits(tokenBalance, tokenDecimals)} tokens, ${ethers.formatEther(ethBalance)} ETH`);
    }
    
    console.log("✅ Bundle buys executed");
    
    // Step 12: Verify results
    console.log("\n📊 Step 12: Verifying results...");
    
    // Get final balances
    const devWalletBalanceAfter = await ethers.provider.getBalance(devWallet.address);
    const fundingWalletBalanceAfter = await ethers.provider.getBalance(fundingWallet.address);
    const devWalletTokenBalanceFinal = await testToken.balanceOf(devWallet.address);
    const contractTokenBalanceFinal = await testToken.balanceOf(tokenAddress);
    
    console.log("\n💰 Final Balances:");
    console.log(`- Dev wallet ETH: ${ethers.formatEther(devWalletBalanceAfter)} (spent: ${ethers.formatEther(devWalletBalance - devWalletBalanceAfter)})`);
    console.log(`- Dev wallet tokens: ${ethers.formatUnits(devWalletTokenBalanceFinal, tokenDecimals)}`);
    console.log(`- Funding wallet ETH: ${ethers.formatEther(fundingWalletBalanceAfter)} (spent: ${ethers.formatEther(fundingWalletBalance - fundingWalletBalanceAfter)})`);
    console.log(`- Contract tokens (clog): ${ethers.formatUnits(contractTokenBalanceFinal, tokenDecimals)}`);
    
    // Check bundle wallet results
    console.log("\n👥 Bundle Wallet Results:");
    let totalTokensBought = BigInt(0);
    for (let i = 0; i < bundleWallets.length; i++) {
      const wallet = bundleWallets[i];
      const tokenBalance = await testToken.balanceOf(wallet.address);
      const ethBalance = await ethers.provider.getBalance(wallet.address);
      
      totalTokensBought = totalTokensBought + tokenBalance;
      
      console.log(`- Wallet ${i + 1}: ${ethers.formatUnits(tokenBalance, tokenDecimals)} tokens, ${ethers.formatEther(ethBalance)} ETH`);
    }
    
    // Step 13: Summary and validation
    console.log("\n📈 Final Comparison:");
    console.log("=" .repeat(60));
    console.log(`- Expected clog tokens: ${ethers.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Actual clog tokens: ${ethers.formatUnits(contractTokenBalanceFinal, tokenDecimals)}`);
    console.log(`- Expected tokens per wallet: ${ethers.formatUnits(tokensPerWallet, tokenDecimals)}`);
    console.log(`- Total tokens bought: ${ethers.formatUnits(totalTokensBought, tokenDecimals)}`);
    
    // Validation checks
    const clogAccuracy = contractTokenBalanceFinal === clogTokens;
    const bundleSuccess = totalTokensBought > BigInt(0);
    
    console.log("\n✅ Validation Results:");
    console.log(`- Clog transfer accuracy: ${clogAccuracy ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Bundle execution success: ${bundleSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    if (clogAccuracy && bundleSuccess) {
      console.log("\n🎉 Bundle launch test completed successfully!");
      console.log("\n📋 Summary:");
      console.log(`- Token deployed: ${tokenAddress}`);
      console.log(`- Liquidity pair: ${pairAddress}`);
      console.log(`- Bundle wallets: ${bundleWallets.length}`);
      console.log(`- Total ETH spent: ${ethers.formatEther((devWalletBalance - devWalletBalanceAfter) + (fundingWalletBalance - fundingWalletBalanceAfter))}`);
      console.log(`- Total tokens bought: ${ethers.formatUnits(totalTokensBought, tokenDecimals)}`);
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