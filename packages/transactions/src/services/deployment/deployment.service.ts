import { ethers } from 'ethers';
import { DeployContractParams, ServiceResponse, TransactionResult } from '../../types';
import { provider } from '../../utils/provider';
import { waitForConfirmation } from '../../utils/transaction-monitoring';
import { WalletService, TransactionsRepository, DeploymentService as SupabaseDeploymentService } from '@eth-deployer/supabase';

export class DeploymentService {
  private walletService = new WalletService();
  private transactionsRepo = new TransactionsRepository();
  private deploymentsService = new SupabaseDeploymentService();

  /**
   * Deploy an ERC20 contract and persist all relevant records.
   */
  async deployContract(params: DeployContractParams): Promise<ServiceResponse<TransactionResult & { contractAddress?: string }>> {
    // 1. Load wallet
    const walletResult = await this.walletService.exportPrivateKey(params.walletId);
    if (!walletResult.success || !walletResult.privateKey) {
      return { success: false, error: 'Failed to load wallet' };
    }
    const signer = new ethers.Wallet(walletResult.privateKey, provider);

    // 2. Prepare contract factory
    const factory = new ethers.ContractFactory(params.abi, params.bytecode, signer);

    // 3. Estimate gas (optional, can be improved)
    let gasLimit = params.gasLimit;
    if (!gasLimit) {
      try {
        gasLimit = await factory.signer.estimateGas({ data: params.bytecode });
      } catch {
        gasLimit = undefined;
      }
    }

    // 4. Create pending transaction record
    console.log('📝 Creating transaction record...');
    const txRecord = await this.transactionsRepo.create({
      wallet_address: signer.address,
      type: 'deployment',
      status: 'pending',
      short_id: '', // Empty string to trigger database generation
    })
    if (!txRecord.success || !txRecord.data) {
      console.error('❌ Failed to create transaction record:', txRecord.error);
      return { success: false, error: 'Failed to create transaction record' };
    }
    console.log('✅ Transaction record created with short_id:', txRecord.data.short_id);

    try {
      // 5. Deploy contract
      const contract = await factory.deploy(...(params.constructorArgs || []), {
        gasLimit,
        value: params.value || 0,
      });

      // 6. Wait for confirmation
      const receipt = await waitForConfirmation(provider, contract.deployTransaction.hash);

      // 7. Update transaction record
      await this.transactionsRepo.update(txRecord.data.id, {
        status: 'confirmed',
        transaction_hash: contract.deployTransaction.hash,
        block_number: receipt.blockNumber,
        gas_used: receipt.gasUsed.toString(),
        gas_price: contract.deployTransaction.gasPrice?.toString() || null,
      });

      // 8. Create deployment record
      console.log('📝 Creating deployment record...');
      console.log('Instance ID:', params.instanceId);
      console.log('Contract address:', contract.address);
      console.log('Wallet ID:', params.walletId);
      console.log('Transaction hash:', contract.deployTransaction.hash);
      
      const deploymentResult = await this.deploymentsService.createDeployment({
        contract_instance_id: params.instanceId || '',
        contract_address: contract.address,
        wallet_id: params.walletId,
        transaction_hash: contract.deployTransaction.hash,
        status: 'success',
      });
      
      if (!deploymentResult.success) {
        console.error('❌ Failed to create deployment record:', deploymentResult.error);
      } else {
        console.log('✅ Deployment record created successfully');
      }

      // 9. Return result
      return {
        success: true,
        data: {
          hash: contract.deployTransaction.hash,
          status: 'confirmed',
          blockNumber: receipt.blockNumber,
          confirmations: receipt.confirmations,
          contractAddress: contract.address,
        },
      };
    } catch (error: any) {
      // 10. Update transaction record as failed
      await this.transactionsRepo.update(txRecord.data.id, {
        status: 'failed',
        error_message: error?.message || 'Deployment failed',
      });
      return { success: false, error: error?.message || 'Deployment failed' };
    }
  }
} 