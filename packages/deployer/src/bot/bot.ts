// src/bot/bot.ts
import { Telegraf, session } from 'telegraf';
import { BotContext, SessionData } from './types';
import { BotHandlers } from './handlers';
import { config } from '../config/env';

export class EthDeployerBot {
	private bot: Telegraf<BotContext>;

	constructor() {
		this.bot = new Telegraf<BotContext>(config.BOT_TOKEN);
		this.setupMiddleware();
		this.setupHandlers();
		this.setupErrorHandling();
	}

	private setupMiddleware() {
		// Session middleware
		this.bot.use(session({
			defaultSession: (ctx: BotContext) => ({
				currentScreen: 'home' as const,
				deployState: undefined
			})
		}));

		// Logging middleware
		this.bot.use((ctx, next) => {
			const user = ctx.from?.username || ctx.from?.id || 'unknown';
			const text = ctx.message && 'text' in ctx.message ? ctx.message.text :
				ctx.callbackQuery && 'data' in ctx.callbackQuery ? `callback: ${ctx.callbackQuery.data}` : 'other';

			console.log(`[${new Date().toISOString()}] User ${user}: ${text}`);
			return next();
		});
	}

	private setupHandlers() {
		// Command handlers
		this.bot.start(BotHandlers.showHome);
		this.bot.command('home', BotHandlers.showHome);
		this.bot.command('deploy', BotHandlers.showDeploy);
		this.bot.help((ctx) => {
			ctx.reply(`
*ETH Token Deployer Bot Commands*

/start - Show home screen
/home - Return to home
/deploy - Start token deployment
/help - Show this help message

*About*
This bot helps you deploy ERC20 tokens on Ethereum. Choose your network environment and start deploying!

Current network: ${config.NETWORK}
      `, { parse_mode: 'Markdown' });
		});

		// Callback query handlers (button clicks)
		this.bot.action('action_home', BotHandlers.showHome);
		this.bot.action('action_deploy', BotHandlers.showDeploy);
		this.bot.action('action_network', BotHandlers.showNetworkStatus);

		// Deploy flow handlers
		this.bot.action('deploy_quick', BotHandlers.showQuickDeploy);
		this.bot.action('deploy_advanced', (ctx) => BotHandlers.showComingSoon(ctx, 'Advanced Deploy'));
		this.bot.action('deploy_template', (ctx) => BotHandlers.showComingSoon(ctx, 'Template Selection'));

		// Coming soon handlers
		this.bot.action('action_wallets', (ctx) => BotHandlers.showComingSoon(ctx, 'Wallet Management'));
		this.bot.action('action_contracts', (ctx) => BotHandlers.showComingSoon(ctx, 'Contract Templates'));
		this.bot.action('action_settings', (ctx) => BotHandlers.showComingSoon(ctx, 'Settings'));

		// Network handlers
		this.bot.action('network_refresh', BotHandlers.showNetworkStatus);
		this.bot.action('network_balance', async (ctx) => {
			try {
				const balance = await web3Provider.getBalance();
				await ctx.answerCbQuery(`Current balance: ${balance} ETH`);
			} catch (error) {
				await ctx.answerCbQuery('Failed to get balance');
			}
		});

		// Quick deploy start
		this.bot.action('quick_deploy_start', BotHandlers.handleQuickDeploy);

		// Error handlers
		this.bot.action('retry', (ctx) => {
			// Retry based on current screen
			const currentScreen = ctx.session.currentScreen;
			switch (currentScreen) {
				case 'deploy':
					return BotHandlers.showDeploy(ctx);
				case 'home':
				default:
					return BotHandlers.showHome(ctx);
			}
		});

		// Catch-all for unhandled messages
		this.bot.on('text', async (ctx) => {
			await ctx.reply(
				"I don't understand that command. Use /help to see available commands or click /start to return to the home screen.",
				{ parse_mode: 'Markdown' }
			);
		});
	}

	private setupErrorHandling() {
		this.bot.catch((err, ctx) => {
			console.error('Bot error:', err);
			BotHandlers.showError(ctx, 'An unexpected error occurred. Please try again.');
		});

		// Handle process termination
		process.once('SIGINT', () => this.stop());
		process.once('SIGTERM', () => this.stop());
	}

	public async start() {
		try {
			console.log('Starting ETH Deployer Bot...');
			console.log(`Environment: ${config.NODE_ENV}`);
			console.log(`Network: ${config.NETWORK}`);

			await this.bot.launch();
			console.log('✅ Bot started successfully!');
		} catch (error) {
			console.error('❌ Failed to start bot:', error);
			throw error;
		}
	}

	public stop() {
		console.log('Stopping bot...');
		this.bot.stop('SIGINT');
		console.log('✅ Bot stopped');
	}
}

// Import web3Provider to initialize it
import { web3Provider } from '../web3/provider';