// comando que tenga varios sub comandos y uno de ellos sirva para poder descargar clips de twitch
import type { IMySlashCommand } from '../../types';
import { SlashCommandBuilder } from 'discord.js';
import utils from '../../lib/Utils';
import download from './download';

export default {
  data: new SlashCommandBuilder()
    .setName('twitch')
    .setDescription('Comandos relacionados con twitch')
    .addSubcommand(download.data),

  async run(interaction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case download.data.name:
        await download.run(interaction);
        break;
    }
  },
} satisfies IMySlashCommand;
