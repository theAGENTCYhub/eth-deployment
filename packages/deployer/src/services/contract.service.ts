// src/services/contract.service.ts
import { ethers, Contract, ContractFactory } from 'ethers';
import { web3Provider } from '../web3/provider';
import { DeploymentResult, TokenParams } from '../bot/types';

// Simple ERC20 ABI
const SIMPLE_ERC20_ABI = [
    "constructor(string memory _name, string memory _symbol, uint256 _totalSupply)",
    "function name() public view returns (string memory)",
    "function symbol() public view returns (string memory)",
    "function decimals() public view returns (uint8)",
    "function totalSupply() public view returns (uint256)",
    "function balanceOf(address) public view returns (uint256)",
    "function transfer(address to, uint256 value) public returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Minimal working ERC20 bytecode - this is a very basic ERC20 implementation
const SIMPLE_ERC20_BYTECODE = "0x60806040526012600260006101000a81548160ff021916908360ff16021790555034801561002c57600080fd5b50604051611681380380611681833981810160405281019061004e91906102fc565b826000908161005d919061059e565b50816001908161006d919061059e565b50600260009054906101000a900460ff16600a61008a91906107df565b81610095919061082a565b600381905550600354600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055503373ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef600354604051610141919061087b565b60405180910390a3505050610896565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101b88261016f565b810181811067ffffffffffffffff821117156101d7576101d6610180565b5b80604052505050565b60006101ea610151565b90506101f682826101af565b919050565b600067ffffffffffffffff82111561021657610215610180565b5b61021f8261016f565b9050602081019050919050565b60005b8381101561024a57808201518184015260208101905061022f565b60008484015250505050565b6000610269610264846101fb565b6101e0565b9050828152602081018484840111156102855761028461016a565b5b61029084828561022c565b509392505050565b600082601f8301126102ad576102ac610165565b5b81516102bd848260208601610256565b91505092915050565b6000819050919050565b6102d9816102c6565b81146102e457600080fd5b50565b6000815190506102f6816102d0565b92915050565b6000806000606084860312156103155761031461015b565b5b600084015167ffffffffffffffff81111561033357610332610160565b5b61033f86828701610298565b935050602084015167ffffffffffffffff8111156103605761035f610160565b5b61036c86828701610298565b925050604061037d868287016102e7565b9150509250925092565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806103d957607f821691505b6020821081036103ec576103eb610392565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026104547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610417565b61045e8683610417565b95508019841693508086168417925050509392505050565b6000819050919050565b600061049b610496610491846102c6565b610476565b6102c6565b9050919050565b6000819050919050565b6104b583610480565b6104c96104c1826104a2565b848454610424565b825550505050565b600090565b6104de6104d1565b6104e98184846104ac565b505050565b5b8181101561050d576105026000826104d6565b6001810190506104ef565b5050565b601f82111561055257610523816103f2565b61052c84610407565b8101602085101561053b578190505b61054f61054785610407565b8301826104ee565b50505b505050565b600082821c905092915050565b600061057560001984600802610557565b1980831691505092915050565b600061058e8383610564565b9150826002028217905092915050565b6105a782610387565b67ffffffffffffffff8111156105c0576105bf610180565b5b6105ca82546103c1565b6105d5828285610511565b600060209050601f83116001811461060857600084156105f6578287015190505b6106008582610582565b865550610668565b601f198416610616866103f2565b60005b8281101561063e57848901518255600182019150602085019450602081019050610619565b8683101561065b5784890151610657601f891682610564565b8355505b6001600288020188555050505b505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600060028204905060018216806106b657607f821691505b6020821081036106c9576106c8610670565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026107427fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610705565b61074c8683610705565b95508019841693508086168417925050509392505050565b6000819050919050565b600061077961077461076f846102c6565b610754565b6102c6565b9050919050565b6000819050919050565b61079783610782565b6107ab6107a38261078a565b848454610424565b825550505050565b600090565b6107c06107b3565b6107cb8184846104ac565b505050565b5b818110156107ed576107e26000826107b6565b6001810190506107e0565b5050565b601f82111561083257610803816103f2565b61080c84610407565b8101602085101561081b578190505b61082f61082785610407565b8301826104ee565b50505b505050565b600082821c905092915050565b600061085360001984600802610557565b1980831691505092915050565b600061086c8383610564565b9150826002028217905092915050565b61088582610387565b67ffffffffffffffff8111156108a05761089f610180565b5b6108a982546103c1565b6108b4828285610511565b600060209050601f8311600181146108e857600084156108d6578287015190505b6108de8582610582565b865550610948565b601f1984166108f6866103f2565b60005b8281101561091e578489015182556001820191506020850194506020810190506108f9565b8683101561093b5784890151610937601f891682610564565b8355505b6001600288020188555050505b505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061097d8261096c565b91506109888361096c565b92508282039050818111156109a05761099f61090f565b5b92915050565b60006109b18261096c565b91506109bc8361096c565b92508282019050808211156109d4576109d361090f565b5b9291505056fea26469706673582212207afc584b8d136c442d8e3df2e64fc1eb20df487f0931dbaee408665979d72d7864736f6c634300081c0033";

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

            // For simplicity, let's use the hardhat default account and deploy a minimal contract
            // Create a simple deployment transaction
            const deployTx = {
                data: this.getDeploymentBytecode(params.name, params.symbol, params.totalSupply),
                gasLimit: 2000000,
            };

            console.log('📝 Sending deployment transaction...');
            const tx = await this.wallet.sendTransaction(deployTx);
            console.log(`Transaction hash: ${tx.hash}`);

            // Wait for transaction confirmation
            const receipt = await tx.wait();

            if (!receipt) {
                throw new Error('Transaction receipt not found');
            }

            const contractAddress = receipt.contractAddress;
            if (!contractAddress) {
                throw new Error('Contract address not found in receipt');
            }

            console.log(`✅ Contract deployed at: ${contractAddress}`);

            const gasUsed = receipt.gasUsed.toString();
            const gasPrice = tx.gasPrice?.toString() || '0';
            const deploymentCost = ethers.utils.formatEther(BigInt(gasUsed) * BigInt(gasPrice));

            return {
                success: true,
                contractAddress,
                transactionHash: tx.hash,
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

    private getDeploymentBytecode(name: string, symbol: string, totalSupply: string): string {
        // For demo purposes, we'll deploy with fixed parameters
        // In a real implementation, you'd encode the constructor parameters
        return SIMPLE_ERC20_BYTECODE;
    }

    async getContractInfo(contractAddress: string): Promise<ContractInfo | null> {
        try {
            console.log(`📖 Reading contract info for: ${contractAddress}`);

            // Create contract instance
            const contract = new Contract(contractAddress, SIMPLE_ERC20_ABI, this.provider);

            // Read contract details with fallbacks
            let name = "Unknown";
            let symbol = "UNK";
            let decimals = 18;
            let totalSupply = "0";
            let deployerBalance = "0";

            try {
                name = await contract.name();
            } catch (e) {
                console.log('Could not read name, using default');
            }

            try {
                symbol = await contract.symbol();
            } catch (e) {
                console.log('Could not read symbol, using default');
            }

            try {
                decimals = Number(await contract.decimals());
            } catch (e) {
                console.log('Could not read decimals, using default');
            }

            try {
                const totalSupplyBN = await contract.totalSupply();
                totalSupply = ethers.utils.formatUnits(totalSupplyBN, decimals);
            } catch (e) {
                console.log('Could not read totalSupply');
            }

            try {
                const balanceBN = await contract.balanceOf(this.wallet.address);
                deployerBalance = ethers.utils.formatUnits(balanceBN, decimals);
            } catch (e) {
                console.log('Could not read deployer balance');
            }

            // Get deployment transaction info
            const deploymentInfo = await this.getDeploymentInfo(contractAddress);

            return {
                address: contractAddress,
                name,
                symbol,
                decimals,
                totalSupply,
                deployerBalance,
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
            const factory = new ethers.ContractFactory(
                SIMPLE_ERC20_ABI,
                SIMPLE_ERC20_BYTECODE,
                this.wallet
            );
            const name = "Test Token";
            const symbol = "TEST";
            const totalSupply = ethers.BigNumber.from("1000000");

            // Prepare deployment transaction
            const deployTx = factory.getDeployTransaction(name, symbol, totalSupply);

            // Estimate gas and add a buffer
            const estimatedGas = await this.wallet.estimateGas(deployTx);
            const gasLimit = estimatedGas.mul(120).div(100); // 20% buffer

            // Deploy with gas limit
            const contract = await factory.deploy(name, symbol, totalSupply, { gasLimit });
            const receipt = await contract.deployTransaction.wait();
            const contractAddress = contract.address;

            if (!contractAddress) {
                throw new Error('Contract address not found');
            }

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