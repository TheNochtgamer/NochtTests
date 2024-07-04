import type { IMySlashCommand } from '../../../../types';
import { SlashCommandBuilder } from 'discord.js';
// import streampreview from './streampreview';

export default {
  data: new SlashCommandBuilder()
    .setName('view')
    .setDescription(
      'Comando para ver informacion que discord normalmente no muestra'
    )
    .setDMPermission(true),
  // .addSubcommand(streampreview.data),
  deferIfToLate: {
    defer: true,
    ephemeral: true,
  },

  async run(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'streampreview':
        break;
    }
  },
} satisfies IMySlashCommand;
