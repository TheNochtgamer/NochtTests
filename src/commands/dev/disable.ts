import type { Bot } from '../../types';
import {
  type CommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import utils from '../../lib/Utils';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('disable')
    .setDescription('Deshabilita un comando')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('Nombre del comando')
        .setAutocomplete(true)
        .setRequired(true),
    )
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Tipo de deshabilitacion')
        .setRequired(true)
        .setChoices(
          {
            name: 'user',
            value: 'user',
          },
          {
            name: 'guild',
            value: 'guild',
          },
          {
            name: 'global',
            value: 'global',
          },
        ),
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Razon de deshabilitacion'),
    ),
  async run(interaction: CommandInteraction & { client: Bot }) {
    const commandName = interaction.options.get('command', true).value;
    // TODO Terminar
  },
};
