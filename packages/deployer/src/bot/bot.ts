// src/bot/bot.ts
import { Telegraf, session } from 'telegraf';
import { BotContext, SessionData } from './types';
import { BotHandlers } from './handlers';
import { SetupHandler } from './handlers/setup.handler';
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
		SetupHandler.setupHandlers(this.bot);
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