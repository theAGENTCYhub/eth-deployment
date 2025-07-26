# ETH Token Deployer - Design Patterns Summary

## 🏗️ **Architecture Overview**
**Monorepo Structure**: Multi-package TypeScript system with clean separation of concerns across domain boundaries.

## 📁 **Package Architecture**
```
eth-deployer/
├── packages/deployer/     # Telegram Bot UI Layer
├── packages/supabase/     # Database Operations Layer  
├── packages/transactions/ # Blockchain Operations Layer
└── packages/compilation/  # Contract Compilation API
```

## 🗃️ **Database Layer Pattern (Supabase Package)**

### **Migration-First Approach**
```
packages/supabase/supabase/migrations/
├── 20250801000001_create_wallets_table.sql
├── 20250801000002_create_bundle_launches_table.sql
└── 20250801000003_update_bundle_wallets_reference.sql
```
- **Sequential migrations** with timestamp prefixes
- **Schema-first design** with proper foreign key relationships
- **Type generation** from database schema to TypeScript interfaces

### **Repository Pattern**
```
packages/supabase/src/repositories/
├── wallets.ts              # Data access for wallets table
├── positions.ts            # Data access for positions table
└── bundle-launches.ts      # Data access for bundle_launches table
```
**Pattern**: Raw database operations with consistent `ServiceResponse<T>` return type
```typescript
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### **Service Layer Pattern**
```
packages/supabase/src/services/
├── wallet.service.ts           # Business logic + encryption/decryption
├── bundle-launches.service.ts  # Launch management business logic
└── deployment.service.ts       # Deployment orchestration
```
**Pattern**: Business logic layer that orchestrates repositories, handles encryption, validation, and complex operations.

## 🤖 **Telegram Bot Architecture (Deployer Package)**

### **Handler-Screen-Keyboard Pattern**
```
packages/deployer/src/bot/
├── handlers/           # Business logic for user interactions
├── screens/           # UI text generation and formatting  
├── keyboards/         # Inline keyboard layout and callbacks
└── services/          # Integration services (trading, etc.)
```

**Flow**: `Handler` processes user input → `Screen` generates response text → `Keyboard` creates interactive buttons

**Example**:
```typescript
// Handler processes logic
export class LaunchesHandler {
  static async showLaunchesList(ctx: any) {
    const launches = await launchService.getUserLaunches(userId);
    await ctx.reply(
      LaunchesScreens.list(launches),           // Screen generates text
      LaunchesKeyboards.list(launches, ctx)     // Keyboard creates buttons
    );
  }
}
```

### **Session State Management**
- **Telegram session storage** for user state across interactions
- **Navigation history** with back button support
- **Callback data compression** for Telegram's callback size limits

## ⛓️ **Blockchain Layer Pattern (Transactions Package)**

### **Transaction Builder Pattern**
```
packages/transactions/src/transactions/
├── erc20.transaction.ts       # ERC20 operation builders
├── uniswap-router.transaction.ts  # Uniswap interaction builders
└── eth.transaction.ts         # ETH transfer builders
```
**Pattern**: Pure transaction building functions that return `PopulatedTransaction` objects

### **Service Orchestration Pattern**
```
packages/transactions/src/services/
├── bundle/
│   ├── bundle-orchestration.service.ts  # Coordinates multiple transactions
│   ├── bundle-creation.service.ts       # Creates transaction bundles
│   └── bundle.service.ts               # Main bundle interface
└── launch/
    └── launch-execution.service.ts      # Executes complete launch flow
```
**Pattern**: Services orchestrate transaction builders into complex multi-step operations

### **Network Abstraction**
- **Contract store** for network-specific contract addresses
- **Provider injection** for different networks (hardhat/testnet/mainnet)
- **Sequential vs Atomic execution** based on network capabilities

## 🔄 **Cross-Package Integration Pattern**

### **Package Imports**
```typescript
// Deployer package imports others
import { WalletService, BundleLaunchesService } from '@eth-deployer/supabase';
import { BundleService, LaunchService } from '@eth-deployer/transactions';
```

### **Service Composition**
```typescript
// Services compose across package boundaries
export class TradingServiceManager {
  constructor(
    private bundleLaunchesService: BundleLaunchesService,  // Supabase
    private tradingService: TradingService,                // Transactions
    private walletService: WalletService                   // Supabase
  ) {}
}
```

## 🛡️ **Type Safety Pattern**
- **Generated database types** from Supabase schema
- **Consistent interfaces** across all packages
- **ServiceResponse<T> wrapper** for all async operations
- **Strict TypeScript configuration** with no implicit any

## 🔐 **Security Patterns**
- **Encrypted private key storage** with decryption only in service layer
- **Environment-based configuration** with different settings per network
- **Secure session management** with proper state isolation

## 📊 **Error Handling Pattern**
```typescript
// Consistent error handling across all services
try {
  const result = await repository.someOperation();
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, data: processedData };
} catch (error) {
  return { success: false, error: error.message };
}
```

This design promotes **modularity**, **testability**, **type safety**, and **maintainability** while keeping clear boundaries between UI, business logic, data access, and blockchain operations.