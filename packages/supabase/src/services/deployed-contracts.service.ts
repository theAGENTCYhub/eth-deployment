import { supabase } from '../client';
import type { Database } from '../types/database.types';

type Deployment = Database['public']['Tables']['deployments']['Row'];
type ContractInstance = Database['public']['Tables']['contract_instances']['Row'];
type Wallet = Database['public']['Tables']['wallets']['Row'];

export interface DeployedContract {
  id: string;
  contract_address: string;
  transaction_hash: string;
  status: 'pending' | 'success' | 'failed';
  deployed_at: string;
  gas_used?: string;
  deployment_cost?: string;
  error_message?: string;
  
  // Contract instance info
  contract_instance: {
    id: string;
    name: string;
    user_id: string;
    template_id: string;
    parameters: any;
    source_code: string;
    status: string;
    created_at: string;
  };
  
  // Wallet info
  wallet: {
    id: string;
    address: string;
    name?: string;
    created_at: string;
  } | null;
}

export interface DeployedContractDetail extends DeployedContract {
  // Additional details for the detail view
  network_info?: {
    name: string;
    chain_id: number;
    block_explorer_url?: string;
  };
}

export class DeployedContractsService {
  /**
   * Get all deployed contracts with pagination
   */
  async getDeployedContracts(page: number = 0, limit: number = 5): Promise<{ 
    success: boolean; 
    data?: DeployedContract[]; 
    total?: number;
    page?: number;
    hasMore?: boolean;
    error?: string 
  }> {
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('deployments')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) {
        return { success: false, error: countError.message };
      }

      // Get paginated deployments with related data
      const { data: deployments, error } = await supabase
        .from('deployments')
        .select(`
          *,
          contract_instance:contract_instances(
            id,
            name,
            user_id,
            template_id,
            parameters,
            source_code,
            status,
            created_at
          ),
          wallet:wallets(
            id,
            address,
            name,
            created_at
          )
        `)
        .eq('is_active', true)
        .order('deployed_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) {
        return { success: false, error: error.message };
      }

      const total = count || 0;
      const hasMore = (page + 1) * limit < total;

      return { 
        success: true, 
        data: deployments as DeployedContract[], 
        total,
        page,
        hasMore
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get a specific deployed contract by ID
   */
  async getDeployedContractById(id: string): Promise<{ 
    success: boolean; 
    data?: DeployedContractDetail; 
    error?: string 
  }> {
    try {
      const { data: deployment, error } = await supabase
        .from('deployments')
        .select(`
          *,
          contract_instance:contract_instances(
            id,
            name,
            user_id,
            template_id,
            parameters,
            source_code,
            status,
            created_at
          ),
          wallet:wallets(
            id,
            address,
            name,
            created_at
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Add network info based on environment
      const networkInfo = this.getNetworkInfo();

      return { 
        success: true, 
        data: {
          ...deployment,
          network_info: networkInfo
        } as DeployedContractDetail
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Soft delete a deployed contract
   */
  async softDeleteContract(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('deployments')
        .update({ 
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get network information based on environment
   */
  private getNetworkInfo() {
    const network = process.env.NETWORK || 'local';
    const chainId = process.env.CHAIN_ID || '31337';
    
    let name = 'Hardhat Local';
    let blockExplorerUrl: string | undefined;

    switch (network.toLowerCase()) {
      case 'sepolia':
        name = 'Sepolia Testnet';
        blockExplorerUrl = `https://sepolia.etherscan.io`;
        break;
      case 'goerli':
        name = 'Goerli Testnet';
        blockExplorerUrl = `https://goerli.etherscan.io`;
        break;
      case 'mainnet':
        name = 'Ethereum Mainnet';
        blockExplorerUrl = `https://etherscan.io`;
        break;
      default:
        name = 'Hardhat Local';
        blockExplorerUrl = undefined;
    }

    return {
      name,
      chain_id: parseInt(chainId),
      block_explorer_url: blockExplorerUrl
    };
  }

  /**
   * Get deployed contracts count
   */
  async getDeployedContractsCount(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { count, error } = await supabase
        .from('deployments')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
} 