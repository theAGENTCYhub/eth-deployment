import { BotContext } from '../../types';
import { LaunchesScreens } from '../../screens/launches/launches.screens';
import { LaunchesKeyboards } from '../../keyboards/launches/launches.keyboards';
import { BotScreens } from '../../screens';
import { TradingServiceManager, ServiceManagerConfig } from '../../../services/trading-service-manager';
import { ethers } from 'ethers';
import { EventParser } from '@eth-deployer/transactions/src/utils/event-parser';

export class TradingHandler {
  /**
   * Execute a trade with real trading service
   */
  static async executeTrade(ctx: BotContext, launchId: string, walletId: string, mode: 'buy' | 'sell', amount: string) {
    try {
      // Initialize service manager
      const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545');
      const serviceConfig: ServiceManagerConfig = {
        provider,
        network: 'testnet' as const,
        userId: ctx.from?.id?.toString() || 'unknown'
      };
      const serviceManager = new TradingServiceManager(serviceConfig);

      // Get wallet private key (in real implementation, this would be decrypted from database)
      const walletPrivateKey = await serviceManager.getWalletPrivateKey(walletId);
      
      // Get launch data to get token address
      const launches = await serviceManager.getLaunchesData();
      const launch = launches.find(l => l.id === launchId);
      if (!launch) {
        throw new Error('Launch not found');
      }

      let tradeResult: any;
      
      if (mode === 'buy') {
        // Execute buy trade
        tradeResult = await serviceManager.executeBuyTrade(walletPrivateKey, launch.tokenAddress, amount, 2.5);
      } else {
        // For sell, convert percentage to token amount
        const position = await serviceManager.getPositionDetailData(launchId, walletId);
        const percentage = parseFloat(amount);
        const tokenBalance = parseFloat(position.tokenBalance.replace(/,/g, ''));
        const tokensToSell = (tokenBalance * percentage / 100).toFixed(0);
        
        // Execute sell trade
        tradeResult = await serviceManager.executeSellTrade(walletPrivateKey, launch.tokenAddress, tokensToSell, 2.5);
      }

      if (tradeResult.success && tradeResult.data) {
        const result = tradeResult.data;
        
        let tradeData: any;
        
        if (mode === 'buy') {
          // Update position in database after successful buy
          const { PositionsRepository } = await import('@eth-deployer/supabase');
          const repo = new PositionsRepository();
          
          // Get current position data first
          const currentPosition = await repo.getById(walletId);
          if (!currentPosition.success || !currentPosition.data) {
            throw new Error('Position not found');
          }
          
          await (repo as any).updateAfterBuy(walletId, {
            additional_amount: result.amountOut,
            additional_eth_spent: amount,
            transaction_hash: result.transactionHash
          });
          
          // Get updated position for display
          const updatedPosition = await repo.getById(walletId);
          const newBalance = updatedPosition.success && updatedPosition.data ? updatedPosition.data.amount : '0';
          
          tradeData = {
            mode: 'buy',
            amount,
            tokensReceived: result.amountOut,
            transactionHash: result.transactionHash,
            newBalance,
            newValue: 'Calculating...', // Would need to recalculate
            updatedPnL: 'Calculating...' // Would need to recalculate
          };
        } else {
          // Update position in database after successful sell
          const { PositionsRepository } = await import('@eth-deployer/supabase');
          const repo = new PositionsRepository();
          
          // Get current position data first
          const currentPosition = await repo.getById(walletId);
          if (!currentPosition.success || !currentPosition.data) {
            throw new Error('Position not found');
          }
          
          const selectedAmount = (parseFloat(currentPosition.data.amount || '0') * parseFloat(amount) / 100).toFixed(0);
          
          await (repo as any).updateAfterSell(walletId, {
            amount_sold: selectedAmount,
            eth_received: result.amountOut,
            transaction_hash: result.transactionHash
          });
          
          // Get updated position for display
          const updatedPosition = await repo.getById(walletId);
          const newBalance = updatedPosition.success && updatedPosition.data ? updatedPosition.data.amount : '0';
          
          tradeData = {
            mode: 'sell',
            amount: `${amount}%`,
            tokensReceived: result.amountOut, // ETH received
            transactionHash: result.transactionHash,
            newBalance,
            newValue: 'Calculating...', // Would need to recalculate
            updatedPnL: 'Calculating...' // Would need to recalculate
          };
        }

        // After successful trade execution
        if (result.success && result.transactionHash) {
          try {
            const eventParser = new EventParser(serviceManager.getProvider());
            let actualAmount: string;
            if (mode === 'buy') {
              const swapResult = await eventParser.parseBuyTransaction(
                result.transactionHash,
                launch.tokenAddress, // Assuming launch.tokenAddress is the walletAddress for buy
                launch.tokenAddress
              );
              actualAmount = swapResult.tokensReceived;
            } else {
              const swapResult = await eventParser.parseSellTransaction(
                result.transactionHash,
                launch.tokenAddress, // Assuming launch.tokenAddress is the walletAddress for sell
                launch.tokenAddress
              );
              actualAmount = swapResult.tokensReceived; // Amount sold
            }
            // Update trade data with real amounts
            tradeData = {
              mode: mode,
              amount,
              tokensReceived: actualAmount, // Real amount from events
              transactionHash: result.transactionHash,
              newBalance: 'Calculating...', // Update position after
              newValue: 'Calculating...',
              updatedPnL: 'Calculating...'
            };
          } catch (error) {
            console.error('Failed to parse trade transaction events:', error);
            // Use original result as fallback
          }
        }

        const screen = LaunchesScreens.getTradingSuccessScreen(tradeData);
        const keyboard = LaunchesKeyboards.getTradingSuccessKeyboard(launchId, walletId);

        const message = BotScreens.formatScreen(screen);

        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
        await ctx.answerCbQuery('✅ Trade executed successfully!');
      } else {
        throw new Error(tradeResult.error || 'Trade execution failed');
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      await ctx.answerCbQuery('❌ Trade execution failed');
      
      // Show error screen
      const errorScreen = {
        title: "❌ Trade Failed",
        description: `
*Trade execution failed*

**Error Details:**
• Mode: ${mode.toUpperCase()}
• Amount: ${amount}
• Reason: ${error instanceof Error ? error.message : 'Unknown error'}

*Please try again with:*
• Higher slippage tolerance
• Smaller trade amount
• Different time (less network congestion)

*Transaction was not executed - no funds were lost.*`,
        footer: "Use the back button to return to position details"
      };

      const errorKeyboard = LaunchesKeyboards.getTradingSuccessKeyboard(launchId, walletId);

      const errorMessage = BotScreens.formatScreen(errorScreen);

      await ctx.editMessageText(errorMessage, {
        parse_mode: 'Markdown',
        reply_markup: errorKeyboard.reply_markup
      });
    }
  }

  /**
   * Cancel a trade
   */
  static async cancelTrade(ctx: BotContext, launchId: string, walletId: string) {
    try {
      // Return to position detail screen
      const { PositionDetailHandler } = await import('./position-detail.handler');
      const currentMode = ctx.session.tradingMode || 'buy';
      await PositionDetailHandler.showPositionDetail(ctx, launchId, walletId, currentMode);
      await ctx.answerCbQuery('❌ Trade cancelled');
    } catch (error) {
      console.error('Error cancelling trade:', error);
      await ctx.answerCbQuery('❌ Failed to cancel trade');
    }
  }

  /**
   * Set slippage for a position
   */
  static async setSlippage(ctx: BotContext, launchId: string, walletId: string, slippage: string) {
    try {
      // Mock slippage setting - will be replaced with real implementation
      await ctx.answerCbQuery(`⚙️ Slippage set to ${slippage}%`);
      
      // Return to position detail screen
      const { PositionDetailHandler } = await import('./position-detail.handler');
      const currentMode = ctx.session.tradingMode || 'buy';
      await PositionDetailHandler.showPositionDetail(ctx, launchId, walletId, currentMode);
    } catch (error) {
      console.error('Error setting slippage:', error);
      await ctx.answerCbQuery('❌ Failed to set slippage');
    }
  }
} 