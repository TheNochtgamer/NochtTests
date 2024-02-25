import LobbiesManager from '../../services/LobbiesManager';
import type { IMySlashCommand } from '../../types';
import { SlashCommandBuilder } from 'discord.js';
// import utils from '../lib/Utils';

export default {
  data: new SlashCommandBuilder()
    .setName('game')
    .setDescription('Comando principal para juegos')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Crea una sala')
        .addStringOption(option =>
          option
            .setName('game')
            .setDescription('El juego que se va a jugar')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('join')
        .setDescription('Unete a una sala')

        .addStringOption(option =>
          option
            .setName('lobby')
            .setDescription('El ID de la sala')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand.setName('leave').setDescription('Abandona la sala actual')
    ),
  async run(interaction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case 'create':
        await LobbiesManager.handleLobbyCreation(interaction);
        break;
      case 'join':
        await LobbiesManager.handleLobbyJoining(interaction);
        break;
      case 'leave':
        await interaction.reply('Dejaste la sala');
        break;
      default:
        break;
    }
  },
} satisfies IMySlashCommand;
