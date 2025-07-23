import { BigNumber } from 'ethers';

// Transaction status for monitoring
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

// Base result for any transaction
export interface TransactionResult {
    hash: string;
    status: TransactionStatus;
    blockNumber?: number;
    confirmations?: number;
    error?: string;
}

// Generic contract call params
export interface ContractCallParams {
    walletId: string;
    contractAddress: string;
    abi: any[];
    method: string;
    args?: any[];
    value?: BigNumber | number | string;
    gasLimit?: BigNumber | number;
}

// Generic transfer params
export interface TransferParams {
    walletId: string;
    to: string;
    amount: BigNumber | string | number;
    gasLimit?: BigNumber | number;
}

// ETH transfer (alias for clarity)
export type EthTransferParams = TransferParams;

// ERC20 transfer (extends generic transfer)
export interface ERC20TransferParams extends TransferParams {
    tokenAddress: string;
}

// Contract deployment params
export interface DeployContractParams {
    walletId: string;
    bytecode: string;
    abi: any[];
    constructorArgs?: any[];
    gasLimit?: BigNumber | number;
    value?: BigNumber | number;
    instanceId?: string; // Contract instance ID for database linking
}

// Uniswap base params
interface UniswapBaseParams {
    walletId: string;
    to: string;
    deadline: number;
}

// Uniswap add liquidity
export interface UniswapAddLiquidityParams extends UniswapBaseParams {
    tokenA: string;
    tokenB: string;
    amountADesired: BigNumber | string | number;
    amountBDesired: BigNumber | string | number;
    amountAMin: BigNumber | string | number;
    amountBMin: BigNumber | string | number;
}

// Uniswap remove liquidity
export interface UniswapRemoveLiquidityParams extends UniswapBaseParams {
    tokenA: string;
    tokenB: string;
    liquidity: BigNumber | string | number;
    amountAMin: BigNumber | string | number;
    amountBMin: BigNumber | string | number;
}

// Uniswap swap params
export interface UniswapSwapParams extends UniswapBaseParams {
    path: string[];
    amountIn: BigNumber | string | number;
    amountOutMin: BigNumber | string | number;
}

// Uniswap quote params/results
export interface UniswapQuoteParams {
    path: string[];
    amountIn: BigNumber | string | number;
}
export interface UniswapQuoteResult {
    amountOut: BigNumber;
    path: string[];
}

// Generic service response
export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
} 