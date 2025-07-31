// src/bot/types/index.ts
import { Context, Scenes } from 'telegraf';

// Navigation history item
export interface NavigationHistoryItem {
  screen: SessionData['currentScreen'];
  data?: any;
}

// Session data interface
export interface SessionData {
  deployState?: {
    step: 
      'select_contract' |
      'enter_name' |
      'enter_symbol' |
      'enter_supply' |
      'confirm' |
      'deploying' |
      'parameter_editing' |
      'parameter_confirmed' |
      'ready_to_deploy' |
      'editing_single_parameter' |
      'wallet_selection' |
      'wallet_selected';
    contractId?: string;
    tokenName?: string;
    tokenSymbol?: string;
    totalSupply?: string;
    deployerAddress?: string;
    templateId?: string;
    discoveredParams?: string[];
    parameterValues?: Record<string, string>;
    modifiedSource?: string;
    currentParameter?: string;
    instanceId?: string;
    selectedWalletId?: string;
    developerWalletId?: string;
  };
  // currentScreen?: 'home' | 'deploy' | 'wallets' | 'contracts' | 'template_selection' | 'parameter_editing' | 'deployment_confirmation' | 'deployment_progress' | 'deployment_result';
  currentScreen?: 'home' | 'deploy' | 'wallets' | 'contracts' | 'template_selection' | 'parameter_editing' | 'deployment_confirmation' | 'deployment_progress' | 'deployment_result'
  | 'wallet_main' | 'wallet_list' | 'wallet_detail' | 'contracts_main' | 'launches_list' | 'launch_detail' | 'launch_management' | 'positions_list' | 'position_detail';
  currentScreenData?: any;
  navigationHistory?: NavigationHistoryItem[];
  walletPage?: number;
  awaitingNicknameWalletId?: string;
  awaitingImportPrivateKey?: boolean;
  contractsState?: {
    templates?: any[];
    currentTemplate?: any;
    contracts?: any[];
    currentContract?: any;
    currentPage?: number;
    total?: number;
  };
  // --- Bundle config editing ---
  awaitingConfigParam?: string;
  configEdit?: any;
  // --- Bundle launch editing ---
  awaitingBundleParam?: string;
  bundleConfig?: any;
  // --- Deployment config editing ---
  deploymentConfigEdit?: any;
  deploymentConfigMode?: 'create' | 'edit';
  deploymentConfigProgress?: {
    name?: boolean;
    template_id?: boolean;
    parameters?: boolean;
  };
  // --- Liquidity config editing ---
  liquidityConfigEdit?: any;
  liquidityConfigMode?: 'create' | 'edit';
  liquidityConfigProgress?: {
    name?: boolean;
    initial_liquidity_eth?: boolean;
    liquidity_wallet_id?: boolean;
  };
  // --- Bundle config editing ---
  bundleConfigEdit?: any;
  bundleConfigMode?: 'create' | 'edit';
  bundleConfigProgress?: {
    name?: boolean;
    bundle_type?: boolean;
    bundle_wallet_count?: boolean;
    total_supply_percentage?: boolean;
    funding_wallet_id?: boolean;
  };
  // --- Launches management ---
  launchesPage?: number;
  currentLaunchId?: string;
  positionsPage?: number;
  currentPositionId?: string;
  tradingMode?: 'buy' | 'sell';
  // --- Contract management ---
  editingContract?: {
    id: string;
    field: string;
  };
  awaitingInput?: string;
  currentInstanceId?: string;
  // --- Parameter editing navigation ---
  paramCallbacks?: Map<string, { action: string; key?: string; walletId?: string; type: string }>;
}

// Extend Telegraf context with session
export interface BotContext extends Context {
  session: SessionData;
}

// Token deployment parameters
export interface TokenParams {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals?: number;
}

// Deployment result
export interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  gasUsed?: string;
  deploymentCost?: string;
  error?: string;
}

// Contract template interface
export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  sourceCode: string;
  abi: any[];
  bytecode: string;
  parameters: string[]; // Required constructor parameters
}

// Wallet configuration
export interface WalletConfig {
  address: string;
  privateKey?: string; // Optional - for generated wallets
  buyAmount?: string; // Amount to buy in ETH
  percentage?: number; // Percentage of total supply to receive
}