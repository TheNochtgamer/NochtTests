import { SlashCommandBuilder } from 'discord.js';
import type {
  IMySlashCommand,
  IMyCommandDataImSubCommand,
} from '../../../types';
// import utils from '../../lib/Utils';
//
import evaluate from './eval';
import reload from './reload';
import cmdtoggle from './cmdtoggle';

const subs = new Map<string, IMySlashCommand<IMyCommandDataImSubCommand>>([
  ['eval', evaluate],
  ['reloadall', reload],
  ['cmdtoggle', cmdtoggle],
]);

export default {
  // data: (() => {
  //   const cmd = new SlashCommandBuilder()
  //     .setName('dev')
  //     .setDescription('Comandos de desarrollador');
  //   subs.forEach(sub => cmd.addSubcommand(sub.data));

  //   return cmd;
  // })(),
  definition: {
    kind: 'SubsOnly',
    data: new SlashCommandBuilder()
      .setName('dev')
      .setDescription('Comandos de desarrollador')
      .addSubcommandGroup(group => {
        subs.forEach(sub => group.addSubcommand(sub.definition.data));
        return group;
      }),
  },
  onlyOwners: true,

  async autoComplete(interaction) {
    const subCommand = interaction.options.getSubcommand(true);
    if (!subs.get(subCommand)?.autoComplete)
      return [{ name: 'error', value: 'error' }];
    return (
      // @ts-ignore Ya se hace el correspondiente chequeo
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
