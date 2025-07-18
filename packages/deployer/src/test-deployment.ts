// Test script for contract deployment
import { ContractService } from './services/contract.service';

async function testDeployment() {
  console.log('🧪 Testing contract deployment...');
  
  try {
    const contractService = new ContractService();
    
    // Test the deployment
    console.log('📝 Starting deployment...');
    const result = await contractService.deployTestContract();
    
    if (result.success) {
      console.log('✅ Deployment successful!');
      console.log('Contract address:', result.contractAddress);
      console.log('Transaction hash:', result.transactionHash);
      console.log('Gas used:', result.gasUsed);
      console.log('Deployment cost:', result.deploymentCost);
      
      // Test getting contract info
      console.log('\n📖 Getting contract info...');
      const contractInfo = await contractService.getContractInfo(result.contractAddress!);
      
      if (contractInfo) {
        console.log('✅ Contract info retrieved:');
        console.log('Name:', contractInfo.name);
        console.log('Symbol:', contractInfo.symbol);
        console.log('Decimals:', contractInfo.decimals);
        console.log('Total Supply:', contractInfo.totalSupply);
        console.log('Deployer Balance:', contractInfo.deployerBalance);
      } else {
        console.log('❌ Failed to get contract info');
      }
      
    } else {
      console.log('❌ Deployment failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDeployment().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 