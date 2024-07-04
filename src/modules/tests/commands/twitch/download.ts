import type { IMySlashSubCommand } from '../../../../types';
import { CommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import utils from '../../../../lib/Utils';

export default {
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

  async run(interaction) {
    const link = interaction.options.get('link', true).value as string;
  },
} satisfies IMySlashSubCommand;
