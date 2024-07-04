import type { IMySlashCommand } from '../../../types';
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Un comando que hace ping')
    .setDescriptionLocalizations({
      'es-ES': 'Un comando que hace ping',
    }),

  async run(interaction) {
    await interaction.reply({
      ephemeral: true,
      content: `Pong! ${interaction.client.ws.ping}ms`,
    });
  },
} satisfies IMySlashCommand;
