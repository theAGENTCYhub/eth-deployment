import { ethers } from 'ethers';

export interface SwapResult {
  tokensReceived: string;  // Actual tokens received (buy) or sold (sell)
  ethAmount: string;       // ETH spent (buy) or received (sell)
  actualSlippage: number;  // Calculated slippage percentage (not implemented)
}

export class EventParser {
  private provider: ethers.providers.Provider;
  
  constructor(provider: ethers.providers.Provider) {
    this.provider = provider;
  }

  /**
   * Parse buy transaction to get actual tokens received
   */
  async parseBuyTransaction(
    txHash: string, 
    walletAddress: string, 
    tokenAddress: string
  ): Promise<SwapResult> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    const tx = await this.provider.getTransaction(txHash);
    
    // ERC20 Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
    const transferTopic = ethers.utils.id('Transfer(address,address,uint256)');
    
    // Find Transfer event where tokens were sent TO the wallet
    const tokenTransfer = receipt.logs.find(log => 
      log.topics[0] === transferTopic &&
      log.address.toLowerCase() === tokenAddress.toLowerCase() &&
      log.topics[2] && 
      ethers.utils.getAddress('0x' + log.topics[2].slice(26)) === walletAddress
    );

    if (!tokenTransfer) {
      throw new Error(`No token transfer found to wallet ${walletAddress} in transaction ${txHash}`);
    }

    const tokensReceived = ethers.BigNumber.from(tokenTransfer.data).toString();
    const ethSpent = tx.value.toString();

    return {
      tokensReceived,
      ethAmount: ethSpent,
      actualSlippage: 0 // Not implemented
    };
  }

  /**
   * Parse sell transaction to get actual tokens sold and ETH received
   */
  async parseSellTransaction(
    txHash: string, 
    walletAddress: string, 
    tokenAddress: string
  ): Promise<SwapResult> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    
    const transferTopic = ethers.utils.id('Transfer(address,address,uint256)');
    
    // Find Transfer event where tokens were sent FROM the wallet
    const tokenTransfer = receipt.logs.find(log => 
      log.topics[0] === transferTopic &&
      log.address.toLowerCase() === tokenAddress.toLowerCase() &&
      log.topics[1] && 
      ethers.utils.getAddress('0x' + log.topics[1].slice(26)) === walletAddress
    );

    if (!tokenTransfer) {
      throw new Error(`No token transfer found from wallet ${walletAddress} in transaction ${txHash}`);
    }

    const tokensSold = ethers.BigNumber.from(tokenTransfer.data).toString();
    
    // For ETH received, look for ETH transfer events or calculate from balance changes
    const ethReceived = await this.calculateETHReceived(receipt, walletAddress);

    return {
      tokensReceived: tokensSold,
      ethAmount: ethReceived,
      actualSlippage: 0
    };
  }

  /**
   * Calculate ETH received from swap (simplified version)
   */
  private async calculateETHReceived(
    receipt: ethers.providers.TransactionReceipt, 
    walletAddress: string
  ): Promise<string> {
    // For now, return 0 - can be enhanced to parse internal transactions
    // or calculate from before/after balance differences
    return '0';
  }

  /**
   * Get current token balance as fallback
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );
      const balance = await tokenContract.balanceOf(walletAddress);
      return balance.toString();
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }

  /**
   * Parse all Transfer events for a token within a block range
   * Useful for bundle launches where we don't have individual transaction hashes
   */
  async parseTransferEventsInBlockRange(
    tokenAddress: string,
    walletAddress: string,
    fromBlock: number,
    toBlock: number
  ): Promise<{ tokensReceived: string; ethSpent: string }> {
    try {
      const transferTopic = ethers.utils.id('Transfer(address,address,uint256)');
      
      // Get all Transfer events for this token in the block range
      const logs = await this.provider.getLogs({
        address: tokenAddress,
        topics: [transferTopic],
        fromBlock,
        toBlock
      });

      let totalTokensReceived = ethers.BigNumber.from(0);
      let totalEthSpent = ethers.BigNumber.from(0);

      for (const log of logs) {
        // Check if this is a transfer TO our wallet
        if (log.topics[2] && 
            ethers.utils.getAddress('0x' + log.topics[2].slice(26)) === walletAddress) {
          
          const tokensReceived = ethers.BigNumber.from(log.data);
          totalTokensReceived = totalTokensReceived.add(tokensReceived);
          
          // Try to get the transaction to determine ETH spent
          try {
            const tx = await this.provider.getTransaction(log.transactionHash);
            if (tx && tx.value) {
              totalEthSpent = totalEthSpent.add(tx.value);
            }
          } catch (error) {
            console.warn(`Could not get transaction ${log.transactionHash} for ETH amount calculation`);
          }
        }
      }

      return {
        tokensReceived: totalTokensReceived.toString(),
        ethSpent: totalEthSpent.toString()
      };
    } catch (error) {
      console.error('Failed to parse transfer events in block range:', error);
      return { tokensReceived: '0', ethSpent: '0' };
    }
  }

  /**
   * Get the block number where a bundle was mined (if we have the bundle hash)
   * This is a placeholder - in practice, you'd need to track bundle submissions
   */
  async getBundleMinedBlock(bundleHash: string): Promise<number | null> {
    // This would need to be implemented based on how you track bundle submissions
    // For now, return null to indicate we don't have this information
    return null;
  }
} 