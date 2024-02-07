import Bot from './lib/structures/Bot';
import { IntentsBitField, Partials, PresenceUpdateStatus } from 'discord.js';
import { config } from 'dotenv';
import configureLog from './lib/SystemLog';
config();
configureLog();

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
})().catch(console.error);
(async function Tirar_los_DADOS){

}

if (process.env.NODE_ENV === 'production') {
  process.on('unhandledRejection', err => {
    console.error(err);
  });
  process.on('uncaughtException', err => {
    console.error(err);
  });
}
