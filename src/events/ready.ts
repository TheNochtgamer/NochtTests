import type { IMyBotEvent } from '../types';
import utils from '../lib/Utils';

// EVENTO DEL BOT READY
export default {
  name: 'ready',

  async run(client) {
    console.log(
      'Bot online como',
      client.user?.username,
      'a disponibilidad de',
      client.guilds.cache.size,
      'servidores.'
    );

    if ((await utils.checkSyncedCommands(client)) > 0) return;
    void utils.summitCommands(client);
  },
} satisfies IMyBotEvent<'ready'>;
