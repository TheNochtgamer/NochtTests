import { SlashCommandBuilder } from 'discord.js';
import type { MySlashCommand } from '../../types';
// import utils from '../../lib/Utils';
//
import evaluate from './eval';
import reload from './reload';
import cmdtoggle from './cmdtoggle';

export default {
  data: new SlashCommandBuilder()
    .setName('dev')
    .setDescription('Comandos de desarrollador')
    .addSubcommand(evaluate.data)
    .addSubcommand(reload.data)
    .addSubcommand(cmdtoggle.data),
  onlyOwners: true,

  async run(interaction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case 'eval':
        await evaluate.run(interaction);
        break;
      case 'reloadall':
        await reload.run(interaction);
        break;
      case 'cmdtoggle':
        await cmdtoggle.run(interaction);
        break;
    }
  },
} satisfies MySlashCommand;
