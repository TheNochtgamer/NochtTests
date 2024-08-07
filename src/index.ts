import 'dotenv/config';
import Bot from './lib/structures/Bot';
import { IntentsBitField, Partials, PresenceUpdateStatus } from 'discord.js';
import SystemLog from './lib/structures/SystemLog';

const logger = new SystemLog('index');

export const bot = new Bot({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
  partials: [Partials.Message],
  presence: { status: PresenceUpdateStatus.DoNotDisturb },
  allowedMentions: { parse: ['users'] },
});

(async function init() {
  await Promise.all([bot.init(process.env.TOKEN ?? '')]);
})().catch(logger.error.bind(logger));

if (process.env.NODE_ENV === 'production') {
  process.on('unhandledRejection', err => {
    logger.error('errorHandling', err);
  });
  process.on('uncaughtException', err => {
    logger.error('errorHandling', err);
  });
}
