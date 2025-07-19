# Compilation API Specification

## Overview
REST API service for compiling Solidity smart contracts using Hardhat. Returns complete contract artifacts including ABI, bytecode, and deployed bytecode.

## Base URL
```
http://compilation-api:3001
```

## Endpoints

### 1. Health Check

**GET** `/health`

Returns the service health status.

#### Response
```json
{
  "status": "healthy",
  "service": "compilation-api",
  "compilerStatus": "ready",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Example
```bash
curl -X GET http://compilation-api:3001/health
```

---

### 2. Compile Contract

**POST** `/compile`

Compiles a Solidity contract and returns the complete artifact.

#### Request Body
```json
{
  "sourceCode": "string",    // Required: Solidity source code
  "contractName": "string"   // Required: Name of the contract to compile
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sourceCode` | string | Yes | The Solidity source code to compile |
| `contractName` | string | Yes | The name of the contract class in the source code |

#### Response

**Success (200)**
```json
{
  "success": true,
  "abi": [
    {
      "inputs": [...],
      "name": "functionName",
      "outputs": [...],
      "stateMutability": "view|pure|nonpayable|payable",
      "type": "function|constructor|event|fallback|receive"
    }
  ],
  "bytecode": "0x608060405234801561001057600080fd5b...",
  "deployedBytecode": "0x608060405234801561001057600080fd5b..."
}
```

**Error (400)**
```json
{
  "success": false,
  "error": "Compilation failed: ParserError: Expected ';' but got 'is'"
}
```

**Error (500)**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the compilation was successful |
| `abi` | array | Contract Application Binary Interface (only on success) |
| `bytecode` | string | Full bytecode including constructor (only on success) |
| `deployedBytecode` | string | Runtime bytecode without constructor (only on success) |
| `error` | string | Error message (only on failure) |

#### ABI Structure

Each ABI item contains:
- `type`: "function", "constructor", "event", "fallback", or "receive"
- `name`: Function/event name (not present for constructor)
- `inputs`: Array of input parameters
- `outputs`: Array of output parameters (only for functions)
- `stateMutability`: "view", "pure", "nonpayable", or "payable"

#### Bytecode Differences

- **`bytecode`**: Full bytecode including constructor parameters - use for contract deployment
- **`deployedBytecode`**: Runtime bytecode without constructor - use for contract verification

#### Examples

**Simple Contract**
```bash
curl -X POST http://compilation-api:3001/compile \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "pragma solidity ^0.8.0; contract SimpleToken { string public name; constructor(string memory _name) { name = _name; } }",
    "contractName": "SimpleToken"
  }'
```

**ERC20 Token**
```bash
curl -X POST http://compilation-api:3001/compile \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "pragma solidity ^0.8.0; contract ERC20 { string public name; string public symbol; uint8 public decimals; uint256 public totalSupply; mapping(address => uint256) public balanceOf; event Transfer(address indexed from, address indexed to, uint256 value); constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply) { name = _name; symbol = _symbol; decimals = _decimals; totalSupply = _totalSupply; balanceOf[msg.sender] = _totalSupply; } function transfer(address to, uint256 value) public returns (bool) { require(balanceOf[msg.sender] >= value, \"Insufficient balance\"); balanceOf[msg.sender] -= value; balanceOf[to] += value; emit Transfer(msg.sender, to, value); return true; } }",
    "contractName": "ERC20"
  }'
```

**Error Example**
```bash
curl -X POST http://compilation-api:3001/compile \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "pragma solidity ^0.8.0; contract Broken { function broken() { this is invalid; } }",
    "contractName": "Broken"
  }'
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Contract compiled successfully |
| 400 | Bad Request - Invalid request or compilation failed |
| 404 | Not Found - Endpoint not found |
| 500 | Internal Server Error - Server error |

## Rate Limiting
Currently no rate limiting is implemented. Consider implementing if needed for production use.

## Security
- CORS enabled for cross-origin requests
- Input validation on all requests
- Helmet security headers
- Request size limit: 10MB

## Notes
- Temporary contract files are automatically cleaned up after compilation
- The service uses Hardhat's compilation engine
- All bytecode is returned as hex strings with "0x" prefix
- ABI follows the Ethereum Contract ABI Specification 