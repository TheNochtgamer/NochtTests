import type { IMySlashCommand } from '@/types';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';

export default {
  definition: {
    kind: 'ImSubCommand',
    data: new SlashCommandSubcommandBuilder()
      .setName('download')
      .setDescription('Descarga un clip de twitch')
      .addStringOption(option =>
        option
          .setName('link')
          .setDescription('Url del clip')
          .setAutocomplete(true)
          .setRequired(true)
      ),
  },

  async run(interaction) {
    const link = interaction.options.get('link', true).value as string;
  },
} satisfies IMySlashCommand;
