import { provider } from './provider';
import { UniswapV2Factory } from '../contracts/uniswap-v2-factory';
import { UniswapV2Pair } from '../contracts/uniswap-v2-pair';
import { ethers } from 'ethers';

const MAINNET_WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const MAINNET_USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

export class WethUsdcPriceFetcher {
  static async getPairAddress(): Promise<string> {
    const factory = new UniswapV2Factory(provider, 'mainnet');
    return await factory.contract.getPair(MAINNET_WETH, MAINNET_USDC);
  }

  static async getReserves(): Promise<{ reserveWETH: ethers.BigNumber; reserveUSDC: ethers.BigNumber }> {
    const pairAddress = await this.getPairAddress();
    if (!pairAddress || pairAddress === ethers.constants.AddressZero) {
      throw new Error('WETH/USDC pair does not exist on Uniswap V2 mainnet');
    }
    const pair = new UniswapV2Pair(pairAddress, provider);
    const [reserve0, reserve1] = await pair.contract.getReserves();
    // Uniswap sorts tokens by address, so check which is which
    const token0 = await pair.contract.token0();
    if (token0.toLowerCase() === MAINNET_WETH.toLowerCase()) {
      return { reserveWETH: reserve0, reserveUSDC: reserve1 };
    } else {
      return { reserveWETH: reserve1, reserveUSDC: reserve0 };
    }
  }

  /**
   * Returns the price of 1 WETH in USDC (as a decimal string, 6 decimals for USDC)
   */
  static async getWethPriceInUsdc(): Promise<string> {
    const { reserveWETH, reserveUSDC } = await this.getReserves();
    if (reserveWETH.isZero()) throw new Error('No WETH liquidity');
    // USDC has 6 decimals, WETH has 18
    const price = reserveUSDC.mul(ethers.constants.WeiPerEther).div(reserveWETH);
    return ethers.utils.formatUnits(price, 6); // USDC decimals
  }

  /**
   * Returns the price of 1 USDC in WETH (as a decimal string, 18 decimals for WETH)
   */
  static async getUsdcPriceInWeth(): Promise<string> {
    const { reserveWETH, reserveUSDC } = await this.getReserves();
    if (reserveUSDC.isZero()) throw new Error('No USDC liquidity');
    const price = reserveWETH.mul(ethers.BigNumber.from(10).pow(6)).div(reserveUSDC);
    return ethers.utils.formatUnits(price, 18); // WETH decimals
  }
} 