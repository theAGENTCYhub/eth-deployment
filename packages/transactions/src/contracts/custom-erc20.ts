import { ethers, Contract } from 'ethers';

// Custom ERC20 ABI for bundle launch operations
export const CUSTOM_ERC20_ABI = [
  // Standard ERC20 functions
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)',
  
  // Custom functions for bundle launches
  'function openTrading() external',
  'function openTradingV2() external',
  'function excludeFromFee(address account) external',
  'function includeInFee(address account) external',
  'function isExcludedFromFee(address account) external view returns (bool)',
  'function _isExcludedFromFee(address) external view returns (bool)',
  'function owner() external view returns (address)',
  'function removeLimits() external',
  'function tradingOpen() external view returns (bool)',
  'function swapEnabled() external view returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

export class CustomERC20 {
  public contract: Contract;
  public signer: ethers.Signer;

  constructor(signer: ethers.Signer, contractAddress: string) {
    this.signer = signer;
    this.contract = new Contract(contractAddress, CUSTOM_ERC20_ABI, signer);
  }

  /**
   * Open trading on the token contract
   */
  async openTrading(): Promise<ethers.ContractTransaction> {
    return await this.contract.openTrading();
  }

  /**
   * Open trading V2 (simplified version without automatic liquidity)
   */
  async openTradingV2(): Promise<ethers.ContractTransaction> {
    return await this.contract.openTradingV2();
  }

  /**
   * Exclude address from fees (owner only)
   */
  async excludeFromFee(address: string): Promise<ethers.ContractTransaction> {
    return await this.contract.excludeFromFee(address);
  }

  /**
   * Include address in fees (owner only)
   */
  async includeInFee(address: string): Promise<ethers.ContractTransaction> {
    return await this.contract.includeInFee(address);
  }

  /**
   * Check if address is excluded from fees (public view)
   */
  async isExcludedFromFee(address: string): Promise<boolean> {
    return await this.contract.isExcludedFromFee(address);
  }

  /**
   * Check if address is excluded from fees (legacy method)
   */
  async isExcludedFromFeeLegacy(address: string): Promise<boolean> {
    return await this.contract._isExcludedFromFee(address);
  }

  /**
   * Get contract owner
   */
  async owner(): Promise<string> {
    return await this.contract.owner();
  }

  /**
   * Remove trading limits
   */
  async removeLimits(): Promise<ethers.ContractTransaction> {
    return await this.contract.removeLimits();
  }

  /**
   * Standard ERC20 functions
   */
  async name(): Promise<string> {
    return await this.contract.name();
  }

  async symbol(): Promise<string> {
    return await this.contract.symbol();
  }

  async decimals(): Promise<number> {
    return await this.contract.decimals();
  }

  async totalSupply(): Promise<ethers.BigNumber> {
    return await this.contract.totalSupply();
  }

  async balanceOf(address: string): Promise<ethers.BigNumber> {
    return await this.contract.balanceOf(address);
  }

  async transfer(to: string, amount: ethers.BigNumber): Promise<ethers.ContractTransaction> {
    return await this.contract.transfer(to, amount);
  }

  async approve(spender: string, amount: ethers.BigNumber): Promise<ethers.ContractTransaction> {
    return await this.contract.approve(spender, amount);
  }

  async allowance(owner: string, spender: string): Promise<ethers.BigNumber> {
    return await this.contract.allowance(owner, spender);
  }
} 