import type { MyBotEvent } from '../../types';
import UsersManager from '../../services/UsersManager';

// EVENTO PARA EL MODO ECO
export default {
  name: 'messageCreate',

  async run(message) {
    if (message.author.bot || !message.content) return;

    const userData = UsersManager.getUserData(message.author.id);

    if (!userData.echo) return;

    try {
      await message.reply({
        content: `\`\`\`\n${message.content.replace(/`/g, '')}\n\`\`\``,
        allowedMentions: { repliedUser: false, parse: [] },
        flags: 'SuppressNotifications',
      });
    } catch (error) {
      console.log(error);
    }
  },
} satisfies MyBotEvent<'messageCreate'>;
