import type { IMyBotEvent } from '../../../types';
import UsersManager from '../../../services/UsersManager';
import SystemLog from '../../../lib/structures/SystemLog';

const logger = new SystemLog('modules', 'dev', 'events', 'echoMode');

// EVENTO PARA EL MODO ECO
export default {
  name: 'messageCreate',

  async run(message) {
    if (message.author.bot || !message.content) return;

    const userData = await UsersManager.getUserData(message.author.id);

    if (!userData.echo_activated) return;

    try {
      await message.reply({
        content: `\`\`\`\n${message.content.replace(/`/g, '')}\n\`\`\``,
        allowedMentions: { repliedUser: false, parse: [] },
        flags: 'SuppressNotifications',
      });
    } catch (error) {
      logger.error('run', 'Error al enviar el mensaje', error);
    }
  },
} satisfies IMyBotEvent<'messageCreate'>;
