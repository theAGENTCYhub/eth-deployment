# Trading Services Implementation

This document outlines the comprehensive trading services implementation for the ETH Token Deployer system, covering Phases 7-10 of the Bundle Management UI System.

## Overview

The trading services provide a complete infrastructure for managing token trading, portfolio calculations, pricing, and launch management. All services follow the established patterns in the transactions package and integrate with existing Uniswap transaction builders.

## Architecture

The services are organized into four main categories:

1. **Trading Services** - Core trading functionality
2. **Calculation Services** - P&L and portfolio analytics
3. **Pricing Services** - Token price management
4. **Launch Management Services** - Liquidity and token management

## Services Overview

### 1. Trading Services (`/services/trading/`)

#### TradingService
The core trading service that handles buy/sell transactions using existing Uniswap transaction builders.

**Key Features:**
- Buy tokens with ETH
- Sell tokens for ETH
- Get trading quotes
- Slippage calculation and management
- Transaction execution and monitoring

**Usage:**
```typescript
import { TradingService, TradingConfig } from '@eth-deployer/transactions';

const config: TradingConfig = {
  provider: ethersProvider,
  network: 'mainnet',
  userId: 'user123'
};

const tradingService = new TradingService(config);

// Buy tokens
const buyResult = await tradingService.buyTokensWithETH({
  walletPrivateKey: '0x...',
  tokenAddress: '0x...',
  ethAmount: '1.0',
  slippagePercent: 2.5
});

// Sell tokens
const sellResult = await tradingService.sellTokensForETH({
  walletPrivateKey: '0x...',
  tokenAddress: '0x...',
  tokenAmount: '1000000',
  slippagePercent: 2.5
});

// Get quotes
const buyQuote = await tradingService.getBuyQuote({
  tokenAddress: '0x...',
  ethAmount: '1.0'
});
```

### 2. Calculation Services (`/services/calculations/`)

#### PnLCalculatorService
Handles profit/loss calculations for individual positions and portfolios.

**Key Features:**
- Position P&L calculation
- Portfolio P&L aggregation
- Percentage change calculations
- Average cost basis calculation
- Unrealized P&L tracking

**Usage:**
```typescript
import { PnLCalculatorService, Position } from '@eth-deployer/transactions';

const pnlService = new PnLCalculatorService();

// Calculate position P&L
const position: Position = {
  id: 'pos123',
  walletAddress: '0x...',
  tokenAddress: '0x...',
  tokenBalance: '1000000',
  entryValue: '1.0',
  entryPrice: '0.000001'
};

const pnlResult = pnlService.calculatePositionPnL(position, '0.000002');

// Calculate portfolio P&L
const portfolioResult = pnlService.calculatePortfolioPnL(positions, currentPrices);
```

#### PortfolioCalculatorService
Provides comprehensive portfolio analytics and metrics.

**Key Features:**
- Portfolio metrics calculation
- Position allocation analysis
- Risk metrics (volatility, Sharpe ratio, max drawdown)
- Performance metrics (win rate, average returns)
- Historical data analysis

**Usage:**
```typescript
import { PortfolioCalculatorService } from '@eth-deployer/transactions';

const portfolioService = new PortfolioCalculatorService();

// Calculate portfolio metrics
const metrics = portfolioService.calculatePortfolioMetrics(pnlCalculations);

// Calculate position allocation
const allocation = portfolioService.calculatePositionAllocation(
  positions,
  currentPrices,
  tokenInfo
);

// Calculate risk metrics
const riskMetrics = portfolioService.calculateRiskMetrics(
  pnlCalculations,
  historicalData
);
```

### 3. Pricing Services (`/services/pricing/`)

#### TokenPriceService
Manages token price fetching, caching, and analysis.

**Key Features:**
- Real-time price fetching from Uniswap
- Price caching with configurable timeouts
- Historical price data
- Price impact calculations
- Multiple price sources support

**Usage:**
```typescript
import { TokenPriceService, TokenPriceConfig } from '@eth-deployer/transactions';

const config: TokenPriceConfig = {
  provider: ethersProvider,
  network: 'mainnet',
  uniswapRouterAddress: '0x...',
  wethAddress: '0x...',
  cacheTimeout: 300 // 5 minutes
};

const priceService = new TokenPriceService(config);

// Get current price
const price = await priceService.getTokenPrice('0x...');

// Get multiple prices
const prices = await priceService.getTokenPrices(['0x...', '0x...']);

// Get historical prices
const historical = await priceService.getHistoricalPrices('0x...', 30);

// Calculate price impact
const impact = await priceService.calculatePriceImpact('0x...', '1.0', true);
```

### 4. Launch Management Services (`/services/launch-management/`)

#### LiquidityManagementService
Handles liquidity pool operations for launched tokens.

**Key Features:**
- Add liquidity to token-ETH pairs
- Remove liquidity from pools
- Pool information retrieval
- Optimal liquidity calculations
- Liquidity position tracking

**Usage:**
```typescript
import { LiquidityManagementService, LiquidityConfig } from '@eth-deployer/transactions';

const config: LiquidityConfig = {
  provider: ethersProvider,
  network: 'mainnet',
  uniswapRouterAddress: '0x...',
  uniswapFactoryAddress: '0x...',
  wethAddress: '0x...'
};

const liquidityService = new LiquidityManagementService(config);

// Add liquidity
const addResult = await liquidityService.addLiquidity({
  walletPrivateKey: '0x...',
  tokenAddress: '0x...',
  tokenAmount: '1000000',
  ethAmount: '1.0'
});

// Remove liquidity
const removeResult = await liquidityService.removeLiquidity({
  walletPrivateKey: '0x...',
  tokenAddress: '0x...',
  liquidityAmount: '1000000000000000000',
  minTokenAmount: '100000',
  minEthAmount: '0.1'
});

// Get pool info
const poolInfo = await liquidityService.getPoolInfo('0x...');
```

## Integration with Bot UI

The services are designed to integrate seamlessly with the existing Telegram bot UI:

### Trading Integration
- The bot's trading handlers use `TradingService` for executing buy/sell transactions
- Quote calculations are performed before showing confirmation screens
- Slippage settings are applied automatically

### Portfolio Integration
- Position screens use `PnLCalculatorService` to display real-time P&L
- Portfolio overview uses `PortfolioCalculatorService` for comprehensive metrics
- Price updates use `TokenPriceService` with caching for performance

### Launch Management Integration
- Launch management screens use `LiquidityManagementService` for pool operations
- Pool analytics are displayed using real-time data from the service

## Data Flow

1. **User Action** → Bot Handler → Service Layer → Transaction Builder → Blockchain
2. **Price Updates** → TokenPriceService → Cache → UI Display
3. **P&L Calculation** → PnLCalculatorService → PortfolioCalculatorService → UI Metrics
4. **Liquidity Operations** → LiquidityManagementService → Uniswap → Transaction Logs

## Error Handling

All services follow the established `ServiceResponse<T>` pattern:

```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

This ensures consistent error handling across the entire system.

## Performance Considerations

- **Price Caching**: TokenPriceService implements configurable caching to reduce API calls
- **Batch Operations**: Multiple token prices can be fetched in parallel
- **Lazy Loading**: Services are instantiated only when needed
- **Connection Pooling**: Provider connections are reused across services

## Testing

Each service includes comprehensive error handling and can be tested with mock data:

```typescript
// Example test setup
const mockProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const mockConfig = {
  provider: mockProvider,
  network: 'testnet' as const,
  userId: 'test-user'
};

const tradingService = new TradingService(mockConfig);
```

## Future Enhancements

### Phase 11: Advanced Analytics
- Real-time portfolio rebalancing
- Automated trading strategies
- Risk management alerts
- Performance benchmarking

### Phase 12: Multi-DEX Support
- Uniswap V3 integration
- SushiSwap support
- DEX aggregation for best prices
- Cross-chain trading

### Phase 13: Social Features
- Portfolio sharing
- Trading competitions
- Community analytics
- Social trading signals

## Configuration

Services can be configured through environment variables:

```bash
# Network configuration
NETWORK=mainnet
UNISWAP_ROUTER_ADDRESS=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
WETH_ADDRESS=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

# Cache configuration
PRICE_CACHE_TIMEOUT=300
MAX_CACHE_SIZE=1000

# API configuration
COINGECKO_API_KEY=your_api_key
DEXSCREENER_API_KEY=your_api_key
```

## Conclusion

The trading services implementation provides a robust foundation for the Bundle Management UI System. All services follow established patterns, integrate with existing infrastructure, and are designed for scalability and maintainability.

The modular architecture allows for easy extension and modification, while the comprehensive error handling ensures reliable operation in production environments. 