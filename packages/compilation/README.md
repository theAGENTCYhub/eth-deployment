# Compilation API Service

A REST API service for compiling Solidity contracts using Hardhat. This service provides on-demand compilation capabilities for Ethereum smart contracts.

## Features

- **REST API**: HTTP endpoints for contract compilation
- **Hardhat Integration**: Uses Hardhat's compilation engine
- **Temporary File Management**: Automatically handles temporary contract files
- **Error Handling**: Comprehensive error responses
- **Health Checks**: Service status monitoring
- **Security**: CORS, Helmet, and input validation

## API Endpoints

### POST /compile
Compiles a Solidity contract and returns the ABI and bytecode.

**Request Body:**
```json
{
  "sourceCode": "pragma solidity ^0.8.0; contract MyToken { ... }",
  "contractName": "MyToken"
}
```

**Response:**
```json
{
  "success": true,
  "abi": [...],
  "bytecode": "0x608060405...",
  "deployedBytecode": "0x608060405..."
}
```

### GET /health
Returns the service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "compilation-api",
  "status": "ready",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Installation

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Start the server
yarn start
```

## Development

```bash
# Run in development mode
yarn dev
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins (default: '*')

## Usage Example

```bash
curl -X POST http://localhost:3001/compile \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "pragma solidity ^0.8.0; contract SimpleToken { string public name; constructor(string memory _name) { name = _name; } }",
    "contractName": "SimpleToken"
  }'
```

## Architecture

The service consists of:

1. **CompilerService**: Handles contract compilation using Hardhat
2. **CompilationServer**: Express server with API endpoints
3. **Type Definitions**: TypeScript interfaces for requests/responses

## Docker Support

This service is designed to be containerized and includes Docker configuration.

### Using Docker Compose (Recommended)

```bash
# Build and start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Using Docker directly

```bash
# Build the image
docker build -t compilation-api .

# Run the container
docker run -p 3001:3001 compilation-api
```

## Error Handling

The service provides detailed error messages for:
- Invalid request format
- Compilation failures
- Missing contract artifacts
- File system errors

## Security

- Input validation for all requests
- CORS protection
- Helmet security headers
- Request size limits
- Temporary file cleanup 