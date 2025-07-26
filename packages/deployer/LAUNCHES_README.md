# Bundle Management System - Launches Implementation

## Overview

This document describes the implementation of the Bundle Management System for the ETH Token Deployer Telegram bot. The system allows users to manage their launched tokens, view positions, and execute trades through a comprehensive UI flow.

## Implementation Status

### ✅ Completed (Phases 1-6)
- **Phase 1**: Home Screen Integration - "🚀 Launches" button added to main menu
- **Phase 2**: Launches Listing Screen - Display user's active launches with pagination
- **Phase 3**: Launch Management Screen - Overview of individual launches
- **Phase 4**: Launch Positions Screen - List positions for a specific launch
- **Phase 5**: Individual Position Screen - Detailed position view with trading options
- **Phase 6**: Trading Execution (Mock) - Mock trading functionality for UI testing

### 🔄 Pending (Phases 7-10)
- **Phase 7**: Trading Services Implementation - Real trading with Uniswap
- **Phase 8**: Calculation Services Implementation - P&L and portfolio calculations
- **Phase 9**: Pricing Services Implementation - Real-time price fetching
- **Phase 10**: Launch Management Services Implementation - Advanced token control

## File Structure

```
packages/deployer/src/bot/
├── handlers/
│   ├── launches/
│   │   ├── launches.handler.ts           # Main launches listing
│   │   ├── positions.handler.ts          # Positions listing
│   │   ├── position-detail.handler.ts    # Individual position management
│   │   └── trading.handler.ts            # Trading execution (mock)
├── screens/
│   └── launches/
│       └── launches.screens.ts           # All launch-related screens
├── keyboards/
│   └── launches/
│       └── launches.keyboards.ts         # All launch-related keyboards
└── types/
    └── index.ts                          # Updated with new screen types
```

## Navigation Flow

```
Home Screen
    ↓ "🚀 Launches"
Launches List Screen
    ↓ Select Launch
Launch Management Screen
    ↓ "📈 Positions"        ↓ "⚙️ Management"
Positions List Screen       Management Screen (FUTURE)
    ↓ Select Position
Position Detail Screen
    ↓ Configure Trade
Trading Execution (Mock)
    ↓ Success/Failure
Position Detail Screen (Updated)
```

## Key Features Implemented

### 1. Launches List Screen
- **Display**: User's active token launches with basic info
- **Pagination**: 5 launches per page with navigation
- **Empty State**: Helpful guidance when no launches exist
- **Navigation**: Back to home, forward to launch details

### 2. Launch Management Screen
- **Overview**: Token details, contract address, total supply
- **Status**: Pool value, positions count, total P&L
- **Actions**: Management (future) and Positions navigation

### 3. Positions List Screen
- **Portfolio Summary**: Total positions, invested amount, current value, P&L
- **Position List**: Individual positions with wallet addresses and P&L
- **Pagination**: 5 positions per page
- **Navigation**: Back to launch, forward to position details

### 4. Position Detail Screen
- **Position Info**: Token balance, entry value, current value, P&L
- **Trading Modes**: Buy and Sell mode toggle
- **Buy Options**: Predefined amounts (0.05, 0.1, 0.25, 0.5 ETH) + custom
- **Sell Options**: Predefined percentages (10%, 25%, 50%, 100%) + custom
- **Settings**: Slippage configuration, position refresh

### 5. Trading Execution (Mock)
- **Trade Confirmation**: Detailed trade summary with gas estimates
- **Success Flow**: Transaction hash, updated position data
- **Error Handling**: Failed trade scenarios with helpful guidance
- **Mock Data**: Simulated trading responses for UI testing

## Data Models

### LaunchData Interface
```typescript
interface LaunchData {
  id: string;
  tokenName: string;
  tokenAddress: string;
  totalSupply: string;
  bundleWallets: number;
  liquidityPool: string;
  poolValue: string;
  positions: number;
  totalPnL: string;
  pnlPercentage: string;
  totalInvested?: string;
  currentValue?: string;
}
```

### PositionData Interface
```typescript
interface PositionData {
  walletId: string;
  walletAddress: string;
  tokenBalance: string;
  entryValue: string;
  currentValue: string;
  pnl: number;
  pnlPercentage: string;
}
```

## Mock Data

The current implementation uses mock data for testing:

### Sample Launches
- **TestToken1**: 1M supply, 5 bundle wallets, +6% P&L
- **TestToken2**: 500K supply, 3 bundle wallets, -4% P&L

### Sample Positions
- **Wallet 1**: 10K tokens, +20% P&L
- **Wallet 2**: 15K tokens, +20% P&L
- **Wallet 3**: 20K tokens, +40% P&L

## Callback Actions

### Launches Navigation
- `action_launches` - Show launches list
- `launch_detail_{id}` - Show launch management
- `launches_page_{page}` - Pagination for launches

### Positions Navigation
- `launch_positions_{launchId}` - Show positions list
- `positions_page_{launchId}_{page}` - Pagination for positions
- `position_detail_{launchId}_{walletId}` - Show position detail

### Trading Actions
- `position_mode_{buy|sell}_{launchId}_{walletId}` - Switch trading mode
- `trade_buy_{launchId}_{walletId}_{amount}` - Initiate buy trade
- `trade_sell_{launchId}_{walletId}_{percentage}` - Initiate sell trade
- `trade_confirm_{launchId}_{walletId}_{mode}_{amount}` - Execute trade
- `trade_cancel_{launchId}_{walletId}` - Cancel trade

### Settings
- `trade_slippage_{launchId}_{walletId}` - Show slippage config
- `slippage_set_{launchId}_{walletId}_{slippage}` - Set slippage
- `position_refresh_{launchId}_{walletId}` - Refresh position data

## Testing

Run the test script to verify functionality:
```bash
cd packages/deployer
npx ts-node test-launches.ts
```

The test covers:
- Launches list screen (with and without data)
- Launch management screen
- Positions list screen
- Position detail screen
- Trading confirmation screen
- All keyboard layouts

## Integration Points

### Database Integration (Future)
- `BundleLaunchesService` - Query user's launches
- `PositionsRepository` - Query/update position data
- `BundleWalletsRepository` - Access wallet information

### Trading Integration (Future)
- Uniswap V2 Router for token swaps
- Gas estimation and optimization
- Slippage protection
- Transaction monitoring

### Pricing Integration (Future)
- Real-time token price fetching
- ETH conversion calculations
- Price caching for performance
- Historical price tracking

## Next Steps

### Phase 7: Trading Services
1. Create `packages/transactions/src/services/trading/` directory
2. Implement `token-trading.service.ts` for core trading
3. Implement `swap-transaction.builder.ts` for Uniswap transactions
4. Implement `slippage-calculator.service.ts` for price impact
5. Implement `trade-execution.service.ts` for transaction execution

### Phase 8: Calculation Services
1. Create `packages/transactions/src/services/calculations/` directory
2. Implement P&L calculator with real-time prices
3. Implement portfolio aggregation
4. Implement cost basis tracking
5. Implement performance metrics

### Phase 9: Pricing Services
1. Create `packages/transactions/src/services/pricing/` directory
2. Implement real-time price fetching from Uniswap
3. Implement price caching system
4. Implement ETH conversion utilities
5. Implement historical price tracking

### Phase 10: Launch Management Services
1. Create `packages/transactions/src/services/launch-management/` directory
2. Implement liquidity management (add/remove)
3. Implement token control functions
4. Implement pool analytics
5. Implement risk management

## Configuration

### Environment Variables
- `BOT_TOKEN` - Telegram bot token
- `NETWORK` - Ethereum network (mainnet/testnet)
- `RPC_URL` - Ethereum RPC endpoint

### Session Management
The bot maintains session state for:
- Current screen navigation
- Launch and position context
- Trading mode and parameters
- Pagination state

## Error Handling

The implementation includes comprehensive error handling:
- Network connectivity issues
- Invalid callback data
- Missing session state
- Trading execution failures
- Database query errors

## Performance Considerations

- **Lazy Loading**: Handlers are imported dynamically to reduce initial load time
- **Pagination**: Large datasets are paginated to improve response times
- **Mock Data**: Current implementation uses static data for fast testing
- **Future Optimization**: Real data will be cached and optimized for performance

## Security Considerations

- **Input Validation**: All user inputs are validated before processing
- **Session Management**: Secure session handling with proper state management
- **Future Security**: Real trading will include proper wallet security and transaction signing

## Contributing

When adding new features:
1. Follow the existing file structure and naming conventions
2. Add comprehensive error handling
3. Include mock data for testing
4. Update the test script
5. Document new callback actions
6. Update this README

## Support

For issues or questions:
1. Check the test script output
2. Verify callback action registration
3. Check session state management
4. Review error logs
5. Test with mock data first 