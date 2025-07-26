import { ethers } from 'ethers';

// Script to get contract addresses from your hardhat fork
async function getContractAddresses() {
  console.log('🔍 Getting contract addresses from hardhat fork...\n');
  
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  
  try {
    // Get network info
    const network = await provider.getNetwork();
    console.log('📡 Network:', network);
    
    // Get block number
    const blockNumber = await provider.getBlockNumber();
    console.log('📦 Block number:', blockNumber);
    
    // Get account balances
    const accounts = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Account 0
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Account 1
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Account 2
    ];
    
    console.log('\n💰 Account balances:');
    for (const account of accounts) {
      const balance = await provider.getBalance(account);
      console.log(`   ${account}: ${ethers.utils.formatEther(balance)} ETH`);
    }
    
    // Common Uniswap V2 addresses to check
    const commonAddresses = [
      { name: 'UniswapV2Factory', address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f' },
      { name: 'UniswapV2Router02', address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' },
      { name: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
    ];
    
    console.log('\n🏗️  Checking common contract addresses:');
    for (const contract of commonAddresses) {
      try {
        const code = await provider.getCode(contract.address);
        if (code !== '0x') {
          console.log(`   ✅ ${contract.name}: ${contract.address} (has code)`);
        } else {
          console.log(`   ❌ ${contract.name}: ${contract.address} (no code)`);
        }
      } catch (error) {
        console.log(`   ❌ ${contract.name}: ${contract.address} (error: ${error})`);
      }
    }
    
    // Check if there are any contracts at the first few addresses
    console.log('\n🔍 Checking first few contract addresses:');
    for (let i = 0; i < 10; i++) {
      const address = `0x${i.toString().padStart(40, '0')}`;
      try {
        const code = await provider.getCode(address);
        if (code !== '0x') {
          console.log(`   Address ${i}: ${address} (has code: ${code.substring(0, 66)}...)`);
        }
      } catch (error) {
        // Ignore errors
      }
    }
    
    console.log('\n📝 To use these addresses in your test:');
    console.log('Update the HARDHAT_CONTRACTS object in test-bundle-launch.ts with the addresses that have code.');
    
  } catch (error) {
    console.error('❌ Error getting contract addresses:', error);
  }
}

getContractAddresses().catch(console.error); 