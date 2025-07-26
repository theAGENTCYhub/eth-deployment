import { ethers } from 'ethers';

// Script to set up test tokens for bundle launch testing
async function setupTestTokens() {
  console.log('🪙 Setting up test tokens for bundle launch...\n');
  
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  
  // Test configuration
  const TEST_CONFIG = {
    tokenAddress: '0x8fF9b5901B1556d8b37964C121f6F960cc99eac9', // Your deployed token address
    devWalletPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Account 0
    tokenDeployerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Assuming same as dev wallet for now
  };
  
  const devWallet = new ethers.Wallet(TEST_CONFIG.devWalletPrivateKey, provider);
  const tokenDeployer = new ethers.Wallet(TEST_CONFIG.tokenDeployerPrivateKey, provider);
  
  // ERC20 ABI for token operations
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
    },
    {
      "constant": false,
      "inputs": [
        {"name": "_to", "type": "address"},
        {"name": "_value", "type": "uint256"}
      ],
      "name": "transfer",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function"
    }
  ];
  
  try {
    console.log('📡 Connecting to network...');
    const network = await provider.getNetwork();
    console.log('Network:', network);
    
    console.log('\n👤 Wallet addresses:');
    console.log('- Dev wallet:', devWallet.address);
    console.log('- Token deployer:', tokenDeployer.address);
    console.log('- Token contract:', TEST_CONFIG.tokenAddress);
    
    // Create token contract instance
    const tokenContract = new ethers.Contract(TEST_CONFIG.tokenAddress, ERC20_ABI, tokenDeployer);
    
    console.log('\n💰 Getting current balances...');
    const devWalletBalance = await provider.getBalance(devWallet.address);
    const tokenDeployerBalance = await provider.getBalance(tokenDeployer.address);
    const devWalletTokenBalance = await tokenContract.balanceOf(devWallet.address);
    const tokenDeployerTokenBalance = await tokenContract.balanceOf(tokenDeployer.address);
    const tokenTotalSupply = await tokenContract.totalSupply();
    const tokenDecimals = await tokenContract.decimals();
    
    console.log('Current balances:');
    console.log(`- Dev wallet ETH: ${ethers.utils.formatEther(devWalletBalance)}`);
    console.log(`- Dev wallet tokens: ${ethers.utils.formatUnits(devWalletTokenBalance, tokenDecimals)}`);
    console.log(`- Token deployer ETH: ${ethers.utils.formatEther(tokenDeployerBalance)}`);
    console.log(`- Token deployer tokens: ${ethers.utils.formatUnits(tokenDeployerTokenBalance, tokenDecimals)}`);
    console.log(`- Token total supply: ${ethers.utils.formatUnits(tokenTotalSupply, tokenDecimals)}`);
    
    // Check if dev wallet already has tokens
    if (devWalletTokenBalance.gt(0)) {
      console.log('\n✅ Dev wallet already has tokens!');
      console.log(`Current balance: ${ethers.utils.formatUnits(devWalletTokenBalance, tokenDecimals)} tokens`);
      
      // Calculate what's needed for bundle launch
      const totalSupply = ethers.BigNumber.from('1000000000000000000000000'); // 1M tokens
      const liquidityTokenPercent = 90; // 90% to liquidity
      const clogTokens = totalSupply.mul(100 - liquidityTokenPercent).div(100);
      const liquidityTokens = totalSupply.sub(clogTokens);
      
      console.log('\n📊 Bundle launch requirements:');
      console.log(`- Clog tokens needed: ${ethers.utils.formatUnits(clogTokens, tokenDecimals)}`);
      console.log(`- Liquidity tokens needed: ${ethers.utils.formatUnits(liquidityTokens, tokenDecimals)}`);
      console.log(`- Total tokens needed: ${ethers.utils.formatUnits(totalSupply, tokenDecimals)}`);
      
      if (devWalletTokenBalance.gte(totalSupply)) {
        console.log('✅ Dev wallet has sufficient tokens for bundle launch!');
        return;
      } else {
        console.log('⚠️  Dev wallet needs more tokens for bundle launch');
        const tokensNeeded = totalSupply.sub(devWalletTokenBalance);
        console.log(`Tokens needed: ${ethers.utils.formatUnits(tokensNeeded, tokenDecimals)}`);
      }
    }
    
    // Check if token deployer has tokens to transfer
    if (tokenDeployerTokenBalance.eq(0)) {
      console.log('\n❌ Token deployer has no tokens to transfer');
      console.log('💡 You need to:');
      console.log('   1. Deploy a new token contract, OR');
      console.log('   2. Transfer tokens to the token deployer address, OR');
      console.log('   3. Use a different address that owns the tokens');
      return;
    }
    
    // Calculate how many tokens to transfer
    const totalSupply = ethers.BigNumber.from('1000000000000000000000000'); // 1M tokens
    const tokensToTransfer = totalSupply.sub(devWalletTokenBalance);
    
    if (tokensToTransfer.lte(0)) {
      console.log('\n✅ Dev wallet already has sufficient tokens');
      return;
    }
    
    if (tokenDeployerTokenBalance.lt(tokensToTransfer)) {
      console.log('\n❌ Token deployer has insufficient tokens');
      console.log(`Available: ${ethers.utils.formatUnits(tokenDeployerTokenBalance, tokenDecimals)}`);
      console.log(`Needed: ${ethers.utils.formatUnits(tokensToTransfer, tokenDecimals)}`);
      return;
    }
    
    console.log('\n🔄 Transferring tokens to dev wallet...');
    console.log(`Amount to transfer: ${ethers.utils.formatUnits(tokensToTransfer, tokenDecimals)} tokens`);
    
    // Estimate gas for transfer
    const gasEstimate = await tokenContract.estimateGas.transfer(devWallet.address, tokensToTransfer);
    const gasPrice = await provider.getGasPrice();
    const gasCost = gasEstimate.mul(gasPrice);
    
    console.log(`Estimated gas: ${gasEstimate.toString()}`);
    console.log(`Gas cost: ${ethers.utils.formatEther(gasCost)} ETH`);
    
    // Check if token deployer has enough ETH for gas
    if (tokenDeployerBalance.lt(gasCost)) {
      console.log('\n❌ Token deployer has insufficient ETH for gas');
      console.log(`Available: ${ethers.utils.formatEther(tokenDeployerBalance)} ETH`);
      console.log(`Needed: ${ethers.utils.formatEther(gasCost)} ETH`);
      return;
    }
    
    // Execute the transfer
    console.log('\n🚀 Executing token transfer...');
    const tx = await tokenContract.transfer(devWallet.address, tokensToTransfer, {
      gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
    });
    
    console.log(`Transaction hash: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log(`✅ Transfer confirmed in block ${receipt.blockNumber}`);
    
    // Verify the transfer
    console.log('\n🔍 Verifying transfer...');
    const newDevWalletTokenBalance = await tokenContract.balanceOf(devWallet.address);
    const newTokenDeployerTokenBalance = await tokenContract.balanceOf(tokenDeployer.address);
    
    console.log('New balances:');
    console.log(`- Dev wallet tokens: ${ethers.utils.formatUnits(newDevWalletTokenBalance, tokenDecimals)}`);
    console.log(`- Token deployer tokens: ${ethers.utils.formatUnits(newTokenDeployerTokenBalance, tokenDecimals)}`);
    
    if (newDevWalletTokenBalance.gte(totalSupply)) {
      console.log('\n🎉 Success! Dev wallet now has sufficient tokens for bundle launch');
      console.log('You can now run the bundle launch validation test');
    } else {
      console.log('\n⚠️  Transfer completed but dev wallet still needs more tokens');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    
    if (error.code === 'CALL_EXCEPTION') {
      console.log('\n💡 This might be because:');
      console.log('   1. The token contract doesn\'t exist at the specified address');
      console.log('   2. The token contract doesn\'t have the expected functions');
      console.log('   3. The token deployer doesn\'t have permission to transfer tokens');
    }
  }
}

setupTestTokens().catch(console.error); 