import 'dotenv/config';
import 'module-alias/register';
import Bot from './lib/structures/Bot';
import { IntentsBitField, Partials, PresenceUpdateStatus } from 'discord.js';
import SystemLog from './lib/structures/SystemLog';
import DatabaseManager from './services/DatabaseManager';
import AgsService from './services/AgsService';

const logger = new SystemLog('index');

if (require.main !== module) {
  console.error(
    'index está siendo importado externamente en vez de ser ejecutado directamente...'
  );
  process.exit(1);
}

const bot = new Bot({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
  ],
  partials: [Partials.Message],
  presence: { status: PresenceUpdateStatus.DoNotDisturb },
  allowedMentions: { parse: ['users'] }
});

(async function init() {
  await DatabaseManager.tryConnection().catch(reason => {
    logger.error('init', 'Error al conectar con la base de datos: ', reason);
    logger.error('init', 'Apagando el sistema...');
    process.exit(1);
  });
  await Promise.all([bot.init(process.env.TOKEN ?? '')]);

  // External Bindings
  AgsService.bot = bot;
})().catch(logger.error.bind(logger));

if ((process.env.NODE_ENV || '').toLowerCase() === 'production') {
  process.on('unhandledRejection', err => {
    logger.error('<index unhandledRejection>', err);
  });
  process.on('uncaughtException', err => {
    logger.error('<index uncaughtException>', err);
  });
}
