// src/bot/types/index.ts
import { Context, Scenes } from 'telegraf';

// Session data interface
export interface SessionData {
  deployState?: {
    step: 'select_contract' | 'enter_name' | 'enter_symbol' | 'enter_supply' | 'confirm' | 'deploying';
    contractId?: string;
    tokenName?: string;
    tokenSymbol?: string;
    totalSupply?: string;
    deployerAddress?: string;
  };
  currentScreen?: 'home' | 'deploy' | 'wallets' | 'contracts';
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