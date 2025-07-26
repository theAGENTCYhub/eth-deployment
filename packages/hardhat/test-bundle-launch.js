const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Bundle Launch System", function () {
  let TestERC20, testToken, devWallet, fundingWallet;
  let bundleWallets = [];
  
  // Test configuration
  const TEST_CONFIG = {
    bundle_wallet_count: 3,
    bundle_token_percent: 10, // 10% of supply
    liquidity_eth_amount: ethers.parseEther("1"), // 1 ETH
    liquidity_token_percent: 90, // 90% to liquidity (10% clog)
  };

  // Contract addresses for Uniswap V2 (mainnet addresses used in hardhat fork)
  const UNISWAP_ADDRESSES = {
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  };

  before(async function () {
    console.log("🚀 Setting up Bundle Launch Test...\n");
    
    // Get signers
    [devWallet, fundingWallet] = await ethers.getSigners();
    
    console.log("📡 Network Info:");
    const network = await ethers.provider.getNetwork();
    console.log(`- Chain ID: ${network.chainId}`);
    console.log(`- Network: ${network.name}`);
    
    console.log("\n👤 Wallet Addresses:");
    console.log(`- Dev wallet: ${devWallet.address}`);
    console.log(`- Funding wallet: ${fundingWallet.address}`);
    
    // Deploy fresh test token
    console.log("\n🏗️  Deploying fresh TestERC20 contract...");
    TestERC20 = await ethers.getContractFactory("TestERC20");
    testToken = await TestERC20.deploy();
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
    expect(devWalletTokenBalance).to.equal(tokenTotalSupply);
    console.log("✅ Dev wallet owns all tokens");
  });

  it("Should deploy token and verify ownership", async function () {
    const tokenTotalSupply = await testToken.totalSupply();
    const devWalletTokenBalance = await testToken.balanceOf(devWallet.address);
    
    expect(devWalletTokenBalance).to.equal(tokenTotalSupply);
    expect(await testToken.owner()).to.equal(devWallet.address);
  });

  it("Should generate bundle wallets", async function () {
    console.log("\n👥 Generating bundle wallets...");
    
    // Generate fresh wallets for bundle
    for (let i = 0; i < TEST_CONFIG.bundle_wallet_count; i++) {
      const wallet = ethers.Wallet.createRandom();
      bundleWallets.push(wallet);
      console.log(`- Wallet ${i + 1}: ${wallet.address}`);
    }
    
    expect(bundleWallets).to.have.length(TEST_CONFIG.bundle_wallet_count);
    console.log(`✅ Generated ${bundleWallets.length} bundle wallets`);
  });

  it("Should calculate bundle configuration correctly", async function () {
    console.log("\n🧮 Calculating bundle configuration...");
    
    const tokenTotalSupply = await testToken.totalSupply();
    const tokenDecimals = await testToken.decimals();
    
    // Calculate expected values
    const totalSupply = ethers.BigNumber.from(tokenTotalSupply);
    const clogTokens = totalSupply.mul(100 - TEST_CONFIG.liquidity_token_percent).div(100);
    const liquidityTokens = totalSupply.sub(clogTokens);
    const bundleTokens = totalSupply.mul(TEST_CONFIG.bundle_token_percent).div(100);
    const tokensPerWallet = bundleTokens.div(TEST_CONFIG.bundle_wallet_count);
    
    console.log("Bundle Configuration:");
    console.log(`- Total supply: ${ethers.formatUnits(totalSupply, tokenDecimals)}`);
    console.log(`- Clog tokens (${100 - TEST_CONFIG.liquidity_token_percent}%): ${ethers.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Liquidity tokens (${TEST_CONFIG.liquidity_token_percent}%): ${ethers.formatUnits(liquidityTokens, tokenDecimals)}`);
    console.log(`- Bundle tokens (${TEST_CONFIG.bundle_token_percent}%): ${ethers.formatUnits(bundleTokens, tokenDecimals)}`);
    console.log(`- Tokens per wallet: ${ethers.formatUnits(tokensPerWallet, tokenDecimals)}`);
    console.log(`- Liquidity ETH: ${ethers.formatEther(TEST_CONFIG.liquidity_eth_amount)}`);
    
    // Verify calculations
    expect(clogTokens.add(liquidityTokens)).to.equal(totalSupply);
    expect(tokensPerWallet.mul(TEST_CONFIG.bundle_wallet_count)).to.equal(bundleTokens);
    
    console.log("✅ Bundle configuration calculations verified");
  });

  it("Should execute clog transfer", async function () {
    console.log("\n🔄 Executing clog transfer...");
    
    const tokenTotalSupply = await testToken.totalSupply();
    const clogTokens = tokenTotalSupply.mul(100 - TEST_CONFIG.liquidity_token_percent).div(100);
    const tokenAddress = await testToken.getAddress();
    
    // Transfer clog tokens to the token contract itself
    const clogTransferTx = await testToken.transfer(tokenAddress, clogTokens);
    await clogTransferTx.wait();
    
    const contractBalance = await testToken.balanceOf(tokenAddress);
    const devWalletBalance = await testToken.balanceOf(devWallet.address);
    
    console.log(`- Clog tokens transferred: ${ethers.formatUnits(clogTokens, await testToken.decimals())}`);
    console.log(`- Contract balance: ${ethers.formatUnits(contractBalance, await testToken.decimals())}`);
    console.log(`- Dev wallet balance: ${ethers.formatUnits(devWalletBalance, await testToken.decimals())}`);
    
    expect(contractBalance).to.equal(clogTokens);
    console.log("✅ Clog transfer successful");
  });

  it("Should create Uniswap pair", async function () {
    console.log("\n🏦 Creating Uniswap pair...");
    
    const factory = new ethers.Contract(
      UNISWAP_ADDRESSES.factory,
      ["function createPair(address tokenA, address tokenB) external returns (address pair)"],
      devWallet
    );
    
    const tokenAddress = await testToken.getAddress();
    const createPairTx = await factory.createPair(tokenAddress, UNISWAP_ADDRESSES.weth);
    const receipt = await createPairTx.wait();
    
    // Extract pair address from event
    const pairAddress = receipt.logs[0].address;
    console.log(`- Pair created at: ${pairAddress}`);
    
    console.log("✅ Uniswap pair created");
  });

  it("Should add liquidity to pair", async function () {
    console.log("\n💧 Adding liquidity...");
    
    const router = new ethers.Contract(
      UNISWAP_ADDRESSES.router,
      [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
      ],
      devWallet
    );
    
    const tokenAddress = await testToken.getAddress();
    const tokenTotalSupply = await testToken.totalSupply();
    const liquidityTokens = tokenTotalSupply.mul(TEST_CONFIG.liquidity_token_percent).div(100);
    
    // Approve router to spend tokens
    const approveTx = await testToken.approve(UNISWAP_ADDRESSES.router, liquidityTokens);
    await approveTx.wait();
    
    // Add liquidity
    const addLiquidityTx = await router.addLiquidityETH(
      tokenAddress,
      liquidityTokens,
      0, // amountTokenMin
      0, // amountETHMin
      devWallet.address,
      Math.floor(Date.now() / 1000) + 3600, // deadline
      { value: TEST_CONFIG.liquidity_eth_amount }
    );
    
    const receipt = await addLiquidityTx.wait();
    console.log(`- Liquidity added: ${ethers.formatUnits(liquidityTokens, await testToken.decimals())} tokens + ${ethers.formatEther(TEST_CONFIG.liquidity_eth_amount)} ETH`);
    
    console.log("✅ Liquidity added successfully");
  });

  it("Should fund bundle wallets", async function () {
    console.log("\n💰 Funding bundle wallets...");
    
    const fundingAmount = ethers.parseEther("0.1"); // 0.1 ETH per wallet
    
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
  });

  it("Should exclude bundle wallets from fees", async function () {
    console.log("\n🚫 Excluding bundle wallets from fees...");
    
    for (let i = 0; i < bundleWallets.length; i++) {
      const wallet = bundleWallets[i];
      const excludeTx = await testToken.excludeFromFee(wallet.address);
      await excludeTx.wait();
      
      const isExcluded = await testToken.isExcludedFromFee(wallet.address);
      console.log(`- Wallet ${i + 1}: ${isExcluded ? "✅ Excluded" : "❌ Not excluded"}`);
      
      expect(isExcluded).to.be.true;
    }
    
    console.log("✅ Bundle wallets excluded from fees");
  });

  it("Should open trading", async function () {
    console.log("\n🚀 Opening trading...");
    
    const openTradingTx = await testToken.openTrading();
    await openTradingTx.wait();
    
    const tradingOpen = await testToken.tradingOpen();
    console.log(`- Trading open: ${tradingOpen}`);
    
    expect(tradingOpen).to.be.true;
    console.log("✅ Trading opened successfully");
  });

  it("Should execute bundle buys", async function () {
    console.log("\n🛒 Executing bundle buys...");
    
    const router = new ethers.Contract(
      UNISWAP_ADDRESSES.router,
      [
        "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable"
      ],
      devWallet
    );
    
    const tokenAddress = await testToken.getAddress();
    const buyAmount = ethers.parseEther("0.05"); // 0.05 ETH per buy
    
    for (let i = 0; i < bundleWallets.length; i++) {
      const wallet = bundleWallets[i];
      const connectedWallet = wallet.connect(ethers.provider);
      
      // Approve router to spend tokens (if needed)
      const approveTx = await testToken.connect(connectedWallet).approve(UNISWAP_ADDRESSES.router, ethers.MaxUint256);
      await approveTx.wait();
      
      // Execute buy
      const buyTx = await router.connect(connectedWallet).swapExactETHForTokensSupportingFeeOnTransferTokens(
        0, // amountOutMin
        [UNISWAP_ADDRESSES.weth, tokenAddress], // path
        wallet.address, // to
        Math.floor(Date.now() / 1000) + 3600, // deadline
        { value: buyAmount }
      );
      
      await buyTx.wait();
      
      const tokenBalance = await testToken.balanceOf(wallet.address);
      const ethBalance = await ethers.provider.getBalance(wallet.address);
      
      console.log(`- Wallet ${i + 1}: ${ethers.formatUnits(tokenBalance, await testToken.decimals())} tokens, ${ethers.formatEther(ethBalance)} ETH`);
    }
    
    console.log("✅ Bundle buys executed");
  });

  it("Should verify final balances and compare with estimates", async function () {
    console.log("\n📊 Final Balance Verification");
    console.log("=" .repeat(60));
    
    const tokenDecimals = await testToken.decimals();
    const tokenTotalSupply = await testToken.totalSupply();
    
    // Calculate expected values
    const totalSupply = ethers.BigNumber.from(tokenTotalSupply);
    const clogTokens = totalSupply.mul(100 - TEST_CONFIG.liquidity_token_percent).div(100);
    const liquidityTokens = totalSupply.sub(clogTokens);
    const bundleTokens = totalSupply.mul(TEST_CONFIG.bundle_token_percent).div(100);
    const tokensPerWallet = bundleTokens.div(TEST_CONFIG.bundle_wallet_count);
    
    // Get final balances
    const devWalletBalanceAfter = await ethers.provider.getBalance(devWallet.address);
    const fundingWalletBalanceAfter = await ethers.provider.getBalance(fundingWallet.address);
    const devWalletTokenBalanceAfter = await testToken.balanceOf(devWallet.address);
    const contractTokenBalance = await testToken.balanceOf(await testToken.getAddress());
    
    console.log("\n💰 Final Balances:");
    console.log(`- Dev wallet ETH: ${ethers.formatEther(devWalletBalanceAfter)}`);
    console.log(`- Dev wallet tokens: ${ethers.formatUnits(devWalletTokenBalanceAfter, tokenDecimals)}`);
    console.log(`- Funding wallet ETH: ${ethers.formatEther(fundingWalletBalanceAfter)}`);
    console.log(`- Contract tokens (clog): ${ethers.formatUnits(contractTokenBalance, tokenDecimals)}`);
    
    console.log("\n👥 Bundle Wallet Results:");
    let totalTokensBought = ethers.BigNumber.from(0);
    for (let i = 0; i < bundleWallets.length; i++) {
      const wallet = bundleWallets[i];
      const tokenBalance = await testToken.balanceOf(wallet.address);
      const ethBalance = await ethers.provider.getBalance(wallet.address);
      
      totalTokensBought = totalTokensBought.add(tokenBalance);
      
      console.log(`- Wallet ${i + 1}: ${ethers.formatUnits(tokenBalance, tokenDecimals)} tokens, ${ethers.formatEther(ethBalance)} ETH`);
      console.log(`  Expected: ${ethers.formatUnits(tokensPerWallet, tokenDecimals)} tokens`);
    }
    
    console.log("\n📈 Comparison:");
    console.log(`- Expected clog tokens: ${ethers.formatUnits(clogTokens, tokenDecimals)}`);
    console.log(`- Actual clog tokens: ${ethers.formatUnits(contractTokenBalance, tokenDecimals)}`);
    console.log(`- Expected tokens per wallet: ${ethers.formatUnits(tokensPerWallet, tokenDecimals)}`);
    console.log(`- Total tokens bought: ${ethers.formatUnits(totalTokensBought, tokenDecimals)}`);
    
    // Verify key expectations
    expect(contractTokenBalance).to.equal(clogTokens);
    expect(totalTokensBought).to.be.gt(0);
    
    console.log("\n✅ Bundle launch validation completed successfully!");
  });
}); 