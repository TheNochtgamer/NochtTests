import type { IMySlashCommand } from '../../../types';
import UsersManager from '../../../services/UsersManager';
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Activa o desactiva el modo eco'),

  async run(interaction) {
    const userData = UsersManager.getUserData(interaction.user.id);

    userData.echo = !userData.echo;

    await interaction.reply({
      // ephemeral: true,
      content: `Modo eco ${userData.echo ? 'activado' : 'desactivado'}`,
    });
  },
} satisfies IMySlashCommand;
