import type { IMySlashCommand } from '@/types';
import { SlashCommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';

export default {
  definition: {
    kind: 'OptionsOnly',
    data: new SlashCommandBuilder()
      .setName('unlink_someone')
      .setDescription('-')
      .addStringOption(option =>
        option
          .setName('reference')
          .setDescription('Referencia del usuario a desvincular')
          .setAutocomplete(true)
          .setRequired(true)
      )
  },

  async autoComplete(interaction) {
    return [];
  },

  async run(interaction) {}
} satisfies IMySlashCommand;
