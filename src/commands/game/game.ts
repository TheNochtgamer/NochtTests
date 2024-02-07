import type { MySlashCommand } from '../../types';
import { SlashCommandBuilder } from 'discord.js';
// import utils from '../lib/Utils';

export default {
  data: new SlashCommandBuilder()
    .setName('game')
    .setDescription('Comando principal para juegos')
    .addSubcommand(subcommand =>
      subcommand.setName('create').setDescription('Crea una sala')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('join').setDescription('Unete a una sala')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('leave').setDescription('Abandona la sala actual')
    ),
  async run(interaction) {
    const subCommand = interaction.options.getSubcommand();
  },
} satisfies MySlashCommand;
