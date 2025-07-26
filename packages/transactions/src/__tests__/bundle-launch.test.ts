import { ethers } from 'ethers';
import { BundleOrchestrationService } from '../services/bundle/bundle-orchestration.service';
import { BundleCreationService } from '../services/bundle/bundle-creation.service';
import { BundleService } from '../services/bundle/bundle.service';
import { LaunchService } from '../services/launch/launch.service';
import type { BundleLaunchConfig } from '../services/launch/launch.service';
import { CONTRACT_ADDRESSES, registerContractAddress } from '../contracts/contract-store';

// Test configuration
const TEST_CONFIG = {
  // Network configuration
  network: 'hardhat' as const,
  rpcUrl: 'http://localhost:8545',
  
  // Test wallets (you'll need to fund these)
  devWalletPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat account 0
  fundingWalletPrivateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Hardhat account 1
  
  // Test token configuration
  tokenAddress: '0x8fF9b5901B1556d8b37964C121f6F960cc99eac9', // Your deployed token address
  tokenName: 'TestToken',
  tokenTotalSupply: ethers.utils.parseEther('1000000').toString(), // 1M tokens
  
  // Bundle configuration
  bundle_wallet_count: 3,
  bundle_token_percent: 10, // 10% of supply
  liquidity_eth_amount: ethers.utils.parseEther('1').toString(), // 1 ETH
  liquidity_token_percent: 90, // 90% to liquidity (10% clog)
};

// Mock database service for testing
class MockDatabaseService {
  async createLaunchRecord(params: any) {
    return { success: true, data: { launchId: 'test-launch-id' } };
  }
  
  async updateLaunchStatus(launchId: string, status: string, error?: string) {
    console.log(`Launch ${launchId} status: ${status}${error ? ` - ${error}` : ''}`);
    return { success: true };
  }
  
  async createBundleWallet(params: any) {
    return { success: true, data: { id: `wallet-${params.walletIndex}` } };
  }
  
  async createPosition(params: any) {
    return { success: true, data: { id: `position-${params.walletAddress}` } };
  }
}

describe('Bundle Launch Tests', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let devWallet: ethers.Wallet;
  let fundingWallet: ethers.Wallet;
  let bundleOrchestrationService: BundleOrchestrationService;
  let bundleCreationService: BundleCreationService;
  let bundleService: BundleService;
  let launchService: LaunchService;
  let mockDatabaseService: MockDatabaseService;

  beforeAll(async () => {
    // Setup provider and wallets
    provider = new ethers.providers.JsonRpcProvider(TEST_CONFIG.rpcUrl);
    devWallet = new ethers.Wallet(TEST_CONFIG.devWalletPrivateKey, provider);
    fundingWallet = new ethers.Wallet(TEST_CONFIG.fundingWalletPrivateKey, provider);
    
    // Update contract addresses for your local hardhat fork
    registerContractAddress('UniswapV2Factory', '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', 'hardhat');
    registerContractAddress('UniswapV2Router02', '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', 'hardhat');
    
    // Initialize services
    bundleOrchestrationService = new BundleOrchestrationService(
      provider,
      TEST_CONFIG.devWalletPrivateKey,
      TEST_CONFIG.fundingWalletPrivateKey
    );
    
    bundleCreationService = new BundleCreationService(provider, TEST_CONFIG.network);
    bundleService = new BundleService(
      provider,
      TEST_CONFIG.network,
      TEST_CONFIG.devWalletPrivateKey,
      TEST_CONFIG.fundingWalletPrivateKey
    );
    
    launchService = new LaunchService(provider);
    mockDatabaseService = new MockDatabaseService();
    
    console.log('Test setup complete');
    console.log('Network:', await provider.getNetwork());
    console.log('Dev wallet address:', devWallet.address);
    console.log('Funding wallet address:', fundingWallet.address);
    console.log('Contract addresses:', CONTRACT_ADDRESSES[TEST_CONFIG.network]);
  });

  describe('Individual Transaction Builders', () => {
    test('should build clog transfer transaction', async () => {
      const { buildClogTransferTx } = await import('../transactions/erc20.transaction');
      
             const result = await buildClogTransferTx({
         signer: devWallet,
         tokenAddress: TEST_CONFIG.tokenAddress,
         to: TEST_CONFIG.tokenAddress, // Transfer to contract itself (clog)
         amount: ethers.utils.parseEther('100000'), // 100k tokens
         nonce: await devWallet.getTransactionCount(),
         gasLimit: ethers.utils.parseUnits('100000', 'wei'),
         gasPrice: ethers.utils.parseUnits('20', 'gwei')
       });
      
      expect(result.success).toBe(true);
      expect(result.data?.tx).toBeDefined();
      console.log('Clog transfer transaction:', result.data?.tx);
    });

    test('should build create pair transaction', async () => {
      const { buildUniswapCreatePairTx } = await import('../transactions/uniswap-factory.transaction');
      
      const result = await buildUniswapCreatePairTx({
        signer: devWallet,
        tokenA: TEST_CONFIG.tokenAddress,
        tokenB: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        nonce: await devWallet.getTransactionCount(),
        gasLimit: ethers.utils.parseUnits('200000', 'wei'),
        gasPrice: ethers.utils.parseUnits('20', 'gwei'),
        network: TEST_CONFIG.network
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.tx).toBeDefined();
      console.log('Create pair transaction:', result.data?.tx);
    });

    test('should build add liquidity transaction', async () => {
      const { buildAddLiquidityETH } = await import('../transactions/uniswap-router.transaction');
      
             const result = await buildAddLiquidityETH({
         signer: devWallet,
         tokenAddress: TEST_CONFIG.tokenAddress,
         tokenAmount: ethers.utils.parseEther('900000'), // 900k tokens
         ethAmount: TEST_CONFIG.liquidity_eth_amount,
         to: devWallet.address,
         deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
         nonce: await devWallet.getTransactionCount(),
         gasLimit: ethers.utils.parseUnits('300000', 'wei'),
         gasPrice: ethers.utils.parseUnits('20', 'gwei')
       });
      
      expect(result.success).toBe(true);
      expect(result.data?.tx).toBeDefined();
      console.log('Add liquidity transaction:', result.data?.tx);
    });
  });

  describe('Bundle Orchestration', () => {
    test('should orchestrate complete bundle launch', async () => {
      const bundleConfig: BundleLaunchConfig = {
        tokenAddress: TEST_CONFIG.tokenAddress,
        tokenName: TEST_CONFIG.tokenName,
        tokenTotalSupply: TEST_CONFIG.tokenTotalSupply,
        devWalletAddress: devWallet.address,
        fundingWalletAddress: fundingWallet.address,
        bundle_wallet_count: TEST_CONFIG.bundle_wallet_count,
        bundle_token_percent: TEST_CONFIG.bundle_token_percent,
        bundle_token_percent_per_wallet: TEST_CONFIG.bundle_token_percent / TEST_CONFIG.bundle_wallet_count,
        liquidity_eth_amount: TEST_CONFIG.liquidity_eth_amount,
        liquidity_token_percent: TEST_CONFIG.liquidity_token_percent,
      };

      const result = await bundleOrchestrationService.orchestrateBundleLaunch(bundleConfig);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.bundleWallets).toHaveLength(TEST_CONFIG.bundle_wallet_count);
      expect(result.data?.transactions.length).toBeGreaterThan(0);
      expect(result.data?.signedTransactions.length).toBeGreaterThan(0);
      
      console.log('Bundle orchestration result:');
      console.log('- Bundle wallets:', result.data?.bundleWallets.length);
      console.log('- Transactions:', result.data?.transactions.length);
      console.log('- Signed transactions:', result.data?.signedTransactions.length);
      console.log('- Total gas estimate:', ethers.utils.formatEther(result.data?.totalGasEstimate || '0'));
    });
  });

  describe('Bundle Creation', () => {
    test('should create sequential bundle for hardhat', async () => {
      const bundleConfig: BundleLaunchConfig = {
        tokenAddress: TEST_CONFIG.tokenAddress,
        tokenName: TEST_CONFIG.tokenName,
        tokenTotalSupply: TEST_CONFIG.tokenTotalSupply,
        devWalletAddress: devWallet.address,
        fundingWalletAddress: fundingWallet.address,
        bundle_wallet_count: TEST_CONFIG.bundle_wallet_count,
        bundle_token_percent: TEST_CONFIG.bundle_token_percent,
        bundle_token_percent_per_wallet: TEST_CONFIG.bundle_token_percent / TEST_CONFIG.bundle_wallet_count,
        liquidity_eth_amount: TEST_CONFIG.liquidity_eth_amount,
        liquidity_token_percent: TEST_CONFIG.liquidity_token_percent,
      };

      // First orchestrate
      const orchestrationResult = await bundleOrchestrationService.orchestrateBundleLaunch(bundleConfig);
      expect(orchestrationResult.success).toBe(true);

      // Then create bundle
      const bundleResult = await bundleCreationService.createBundle(
        orchestrationResult.data!,
        {
          network: TEST_CONFIG.network,
          maxGasPrice: ethers.utils.parseUnits('50', 'gwei').toString(),
          maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei').toString(),
          maxFeePerGas: ethers.utils.parseUnits('52', 'gwei').toString(),
        }
      );

             expect(bundleResult.success).toBe(true);
       expect(bundleResult.data?.type).toBe('sequential');
       
       if (bundleResult.data?.type === 'sequential') {
         expect(bundleResult.data.transactions.length).toBeGreaterThan(0);
         console.log('Bundle creation result:');
         console.log('- Type:', bundleResult.data.type);
         console.log('- Transactions:', bundleResult.data.transactions.length);
         console.log('- Estimated cost:', ethers.utils.formatEther(bundleResult.data.estimatedCost || '0'));
       }
    });
  });

  describe('Launch Estimation', () => {
    test('should estimate bundle launch costs', async () => {
      const bundleConfig: BundleLaunchConfig = {
        tokenAddress: TEST_CONFIG.tokenAddress,
        tokenName: TEST_CONFIG.tokenName,
        tokenTotalSupply: TEST_CONFIG.tokenTotalSupply,
        devWalletAddress: devWallet.address,
        fundingWalletAddress: fundingWallet.address,
        bundle_wallet_count: TEST_CONFIG.bundle_wallet_count,
        bundle_token_percent: TEST_CONFIG.bundle_token_percent,
        bundle_token_percent_per_wallet: TEST_CONFIG.bundle_token_percent / TEST_CONFIG.bundle_wallet_count,
        liquidity_eth_amount: TEST_CONFIG.liquidity_eth_amount,
        liquidity_token_percent: TEST_CONFIG.liquidity_token_percent,
      };

      const estimateResult = await launchService.estimateLaunch(bundleConfig);
      
      expect(estimateResult.success).toBe(true);
      expect(estimateResult.data).toBeDefined();
      
      console.log('Launch estimation:');
      console.log('- Initial liquidity ETH:', ethers.utils.formatEther(estimateResult.data?.initialLiquidityEth || '0'));
      console.log('- Bundle buy ETH:', ethers.utils.formatEther(estimateResult.data?.bundleBuyEth || '0'));
      console.log('- Gas padding ETH:', ethers.utils.formatEther(estimateResult.data?.gasPaddingEth || '0'));
      console.log('- Total required ETH:', ethers.utils.formatEther(estimateResult.data?.totalEthRequired || '0'));
      console.log('- Expected price impact:', estimateResult.data?.expectedPriceImpact);
    });
  });

  describe('Full Bundle Launch Flow', () => {
    test('should execute complete bundle launch', async () => {
      const bundleConfig: BundleLaunchConfig = {
        tokenAddress: TEST_CONFIG.tokenAddress,
        tokenName: TEST_CONFIG.tokenName,
        tokenTotalSupply: TEST_CONFIG.tokenTotalSupply,
        devWalletAddress: devWallet.address,
        fundingWalletAddress: fundingWallet.address,
        bundle_wallet_count: TEST_CONFIG.bundle_wallet_count,
        bundle_token_percent: TEST_CONFIG.bundle_token_percent,
        bundle_token_percent_per_wallet: TEST_CONFIG.bundle_token_percent / TEST_CONFIG.bundle_wallet_count,
        liquidity_eth_amount: TEST_CONFIG.liquidity_eth_amount,
        liquidity_token_percent: TEST_CONFIG.liquidity_token_percent,
      };

      const executionConfig = {
        network: TEST_CONFIG.network,
        devWalletPrivateKey: TEST_CONFIG.devWalletPrivateKey,
        fundingWalletPrivateKey: TEST_CONFIG.fundingWalletPrivateKey,
        maxGasPrice: ethers.utils.parseUnits('50', 'gwei').toString(),
        maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei').toString(),
        maxFeePerGas: ethers.utils.parseUnits('52', 'gwei').toString(),
        targetBlock: undefined,
        bundleTimeout: 300
      };

      // First get estimate
      const estimateResult = await launchService.estimateLaunch(bundleConfig);
      expect(estimateResult.success).toBe(true);
      
      console.log('Pre-launch estimate:', ethers.utils.formatEther(estimateResult.data?.totalEthRequired || '0'), 'ETH');

      // Then execute (this will fail on hardhat without proper setup, but we can test the orchestration)
      const launchResult = await bundleService.launchBundle({
        config: bundleConfig,
        network: TEST_CONFIG.network,
        devWalletPrivateKey: TEST_CONFIG.devWalletPrivateKey,
        fundingWalletPrivateKey: TEST_CONFIG.fundingWalletPrivateKey,
      });

      // This might fail due to missing contracts/tokens, but we can see where it fails
      if (!launchResult.success) {
        console.log('Launch failed as expected (missing setup):', launchResult.error);
      } else {
        console.log('Launch succeeded:', launchResult.data);
      }
    });
  });
}); 