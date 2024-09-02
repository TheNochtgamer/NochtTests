import type { IMySlashCommand } from '../../../types';
import UsersManager from '../../../services/UsersManager';
import { SlashCommandBuilder } from 'discord.js';

export default {
  definition: {
    kind: 'OptionsOnly',
    data: new SlashCommandBuilder()
      .setName('echo')
      .setDescription('Activa o desactiva el modo eco'),
  },

  async run(interaction) {
    const userData = await UsersManager.getUserData(interaction.user.id);

    userData.echoActivated = !userData.echoActivated;

    await interaction.reply({
      // ephemeral: true,
      content: `Modo eco ${
        userData.echoActivated ? 'activado' : 'desactivado'
      }`,
    });
  },
} satisfies IMySlashCommand;
