import { SlashCommandBuilder } from 'discord.js';
import type { IMySlashCommand, IMySlashSubCommand } from '../../types';
// import utils from '../../lib/Utils';
//
import evaluate from './eval';
import reload from './reload';
import cmdtoggle from './cmdtoggle';

const subs = new Map<string, IMySlashSubCommand>([
  ['eval', evaluate],
  ['reloadall', reload],
  ['cmdtoggle', cmdtoggle],
]);

export default {
  data: (() => {
    const cmd = new SlashCommandBuilder()
      .setName('dev')
      .setDescription('Comandos de desarrollador');
    subs.forEach(sub => cmd.addSubcommand(sub.data));

    return cmd;
  })(),
  onlyOwners: true,

  async autoComplete(interaction) {
    const subCommand = interaction.options.getSubcommand(true);
    if (!subs.get(subCommand)?.autoComplete)
      return [{ name: 'error', value: 'error' }];
    return (
      // @ts-expect-error Se define el autoComplete en el subCommand
      (await subs.get(subCommand)?.autoComplete(interaction)) ?? [
        {
          name: 'error',
          value: 'error',
        },
      ]
    );
  },

  async run(interaction) {
    const subCommand = interaction.options.getSubcommand(true);

    await subs.get(subCommand)?.run(interaction);
  },
} satisfies IMySlashCommand;
