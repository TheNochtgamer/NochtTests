import type { MyBotEvent } from '../types';
import utils from '../lib/Utils';

// EVENTO DEL BOT READY
export default {
  name: 'ready',

  async run(client) {
    console.log('Bot online como', client.user?.username);

    if ((await utils.checkSyncedCommands(client)) > 0) return;
    void utils.summitCommands(client);
  },
} satisfies MyBotEvent<'ready'>;
