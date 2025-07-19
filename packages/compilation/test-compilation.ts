import { CompilerService } from './src/compiler.service';

async function testCompilation() {
  const compiler = new CompilerService();
  
  const testContract = `
pragma solidity ^0.8.0;

contract SimpleToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        balanceOf[msg.sender] = _totalSupply;
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
}
  `;

  try {
    console.log('🧪 Testing compilation service...');
    
    const result = await compiler.compileContract({
      sourceCode: testContract,
      contractName: 'SimpleToken'
    });

    if (result.success) {
      console.log('✅ Compilation successful!');
      console.log(`📄 ABI length: ${result.abi?.length || 0} items`);
      console.log(`🔗 Bytecode length: ${result.bytecode?.length || 0} characters`);
      console.log(`🔗 Bytecode starts with: ${result.bytecode?.substring(0, 10)}...`);
      console.log(`🚀 Deployed Bytecode length: ${result.deployedBytecode?.length || 0} characters`);
      console.log(`🚀 Deployed Bytecode starts with: ${result.deployedBytecode?.substring(0, 10)}...`);
    } else {
      console.log('❌ Compilation failed:', result.error);
    }
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

if (require.main === module) {
  testCompilation().catch(console.error);
} 