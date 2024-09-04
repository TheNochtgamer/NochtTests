// comando que tenga varios sub comandos y uno de ellos sirva para poder descargar clips de twitch
import type { IMySlashCommand } from '@/types';
import { SlashCommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';
import download from './download';

export default {
  definition: {
    kind: 'SubsOnly',
    data: new SlashCommandBuilder()
      .setName('twitch')
      .setDescription('Comandos relacionados con twitch')
      .addSubcommand(download.definition.data),
  },

  async run(interaction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case download.definition.data.name:
        await download.run(interaction);
        break;
    }
  },
} satisfies IMySlashCommand;
