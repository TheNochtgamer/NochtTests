import type { IMyBotEvent } from '@/types';
import utils from '@/lib/Utils';
import SystemLog from '@/lib/structures/SystemLog';

const logger = new SystemLog('modules', 'm_init', 'events', 'ready');

// EVENTO DEL BOT READY
export default {
  name: 'ready',

  async run(client) {
    logger.log(
      'run',
      'Bot online como',
      client.user?.username,
      'a disponibilidad de',
      client.guilds.cache.size,
      'servidores.'
    );

    // if (process.env.CHECK_COMMANDS?.toLowerCase() !== 'true') return;
    // if ((await utils.checkSyncedCommands(client)) > 0) return;
    // void utils.summitCommands(client);
  },
} satisfies IMyBotEvent<'ready'>;
