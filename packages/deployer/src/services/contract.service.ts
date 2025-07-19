// src/services/contract.service.ts
import { ethers, Contract, ContractFactory } from 'ethers';
import { web3Provider } from '../web3/provider';
import { DeploymentResult, TokenParams } from '../bot/types';

// Import the compiled contract artifacts
import contractArtifacts from './SimpleERC20.json';

export interface ContractInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    deployerBalance: string;
    transactionHash: string;
    gasUsed: string;
    deploymentCost: string;
}


export class ContractService {
    private provider = web3Provider.getProvider();
    private wallet = web3Provider.getWallet();

    async deploySimpleERC20(params: TokenParams = {
        name: "Test Token",
        symbol: "TEST",
        totalSupply: "1000000"
    }): Promise<DeploymentResult> {
        try {
            console.log('🚀 Starting contract deployment...');
            console.log('Parameters:', params);

            // Create contract factory using the compiled artifacts
            const factory = new ContractFactory(
                contractArtifacts.abi,
                contractArtifacts.bytecode,
                this.wallet
            );

            // Convert totalSupply to BigNumber and set decimals
            const totalSupplyBN = ethers.utils.parseUnits(params.totalSupply, params.decimals || 18);
            const decimals = params.decimals || 18;

            console.log('📝 Deploying contract with parameters:');
            console.log(`  Name: ${params.name}`);
            console.log(`  Symbol: ${params.symbol}`);
            console.log(`  Decimals: ${decimals}`);
            console.log(`  Total Supply: ${params.totalSupply} (${totalSupplyBN.toString()} wei)`);

            // Deploy the contract
            const contract = await factory.deploy(params.name, params.symbol, decimals);
            console.log(`Transaction hash: ${contract.deployTransaction.hash}`);

            // Wait for deployment to complete
            const receipt = await contract.deployTransaction.wait();

            if (!receipt) {
                throw new Error('Transaction receipt not found');
            }

            const contractAddress = contract.address;
            console.log(`✅ Contract deployed at: ${contractAddress}`);

            // Calculate deployment cost
            const gasUsed = receipt.gasUsed.toString();
            const gasPrice = contract.deployTransaction.gasPrice?.toString() || '0';
            const deploymentCost = ethers.utils.formatEther(BigInt(gasUsed) * BigInt(gasPrice));

            // Mint initial supply to deployer
            console.log('💰 Minting initial supply to deployer...');
            const mintTx = await contract.mint(this.wallet.address, totalSupplyBN);
            const mintReceipt = await mintTx.wait();
            console.log(`✅ Initial supply minted. Transaction: ${mintTx.hash}`);

            return {
                success: true,
                contractAddress,
                transactionHash: contract.deployTransaction.hash,
                gasUsed,
                deploymentCost: deploymentCost.toString()
            };

        } catch (error) {
            console.error('❌ Contract deployment failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown deployment error'
            };
        }
    }

    async getContractInfo(contractAddress: string): Promise<ContractInfo | null> {
        try {
            console.log(`📖 Reading contract info for: ${contractAddress}`);

            // Create contract instance using the compiled ABI
            const contract = new Contract(contractAddress, contractArtifacts.abi, this.provider);

            // Read contract details
            const [name, symbol, decimals, totalSupply, deployerBalance] = await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals(),
                contract.totalSupply(),
                contract.balanceOf(this.wallet.address)
            ]);

            // Format values
            const formattedTotalSupply = ethers.utils.formatUnits(totalSupply, decimals);
            const formattedDeployerBalance = ethers.utils.formatUnits(deployerBalance, decimals);

            // Get deployment transaction info
            const deploymentInfo = await this.getDeploymentInfo(contractAddress);

            return {
                address: contractAddress,
                name,
                symbol,
                decimals: Number(decimals),
                totalSupply: formattedTotalSupply,
                deployerBalance: formattedDeployerBalance,
                transactionHash: deploymentInfo?.hash || 'Unknown',
                gasUsed: deploymentInfo?.gasUsed || 'Unknown',
                deploymentCost: deploymentInfo?.cost || 'Unknown'
            };

        } catch (error) {
            console.error('❌ Failed to read contract info:', error);
            return null;
        }
    }

    private async getDeploymentInfo(contractAddress: string): Promise<{
        hash: string;
        gasUsed: string;
        cost: string;
    } | null> {
        try {
            // Search recent blocks for the deployment transaction
            const currentBlock = await this.provider.getBlockNumber();

            for (let i = 0; i < 50; i++) {
                const blockNumber = currentBlock - i;
                const block = await this.provider.getBlock(blockNumber);

                if (block?.transactions) {
                    for (const txHash of block.transactions) {
                        const tx = await this.provider.getTransaction(txHash);
                        if (tx) {
                            const receipt = await this.provider.getTransactionReceipt(txHash);
                            if (receipt?.contractAddress?.toLowerCase() === contractAddress.toLowerCase()) {
                                const gasUsed = receipt.gasUsed.toString();
                                const gasPrice = tx.gasPrice?.toString() || '0';
                                const cost = ethers.utils.formatEther(BigInt(gasUsed) * BigInt(gasPrice));

                                return {
                                    hash: txHash,
                                    gasUsed,
                                    cost
                                };
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to find deployment info:', error);
        }

        return null;
    }

    async validateDeployment(contractAddress: string): Promise<boolean> {
        try {
            const code = await this.provider.getCode(contractAddress);
            return code !== '0x' && code.length > 2;
        } catch (error) {
            console.error('Failed to validate deployment:', error);
            return false;
        }
    }

    // Alternative: Deploy a very simple contract for testing
    async deployTestContract(): Promise<DeploymentResult> {
        try {
            const factory = new ContractFactory(
                contractArtifacts.abi,
                contractArtifacts.bytecode,
                this.wallet
            );
            
            const name = "Test Token";
            const symbol = "TEST";
            const decimals = 18;
            const totalSupply = ethers.utils.parseUnits("1000000", decimals);

            console.log('📝 Deploying test contract...');
            const contract = await factory.deploy(name, symbol, decimals);
            const receipt = await contract.deployTransaction.wait();
            const contractAddress = contract.address;

            if (!contractAddress) {
                throw new Error('Contract address not found');
            }

            // Mint initial supply
            console.log('💰 Minting initial supply...');
            const mintTx = await contract.mint(this.wallet.address, totalSupply);
            await mintTx.wait();

            return {
                success: true,
                contractAddress,
                transactionHash: contract.deployTransaction.hash,
                gasUsed: receipt?.gasUsed.toString() || '0',
                deploymentCost: ethers.utils.formatEther(
                    BigInt(receipt?.gasUsed.toString() || '0') * BigInt(contract.deployTransaction.gasPrice?.toString() || '0')
                )
            };
        } catch (error) {
            console.error('❌ Test contract deployment failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown deployment error'
            };
        }
    }

}

