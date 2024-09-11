import type { IMyCommandDataImSubCommand, IMySlashCommand } from '@/types';
import { SlashCommandBuilder } from 'discord.js';

import linkme from './linkme';

const subs = new Map<string, IMySlashCommand<IMyCommandDataImSubCommand>>([
  ['linkme', linkme],
]);

export default {
  // definition: {
  //   kind: 'SubsOnly',
  //   data: new SlashCommandBuilder()
  //     .setName('ags')
  //     .setDescription('Comandos relacionados a la AGS')
  //     .addSubcommandGroup(group => {
  //       subs.forEach(sub => group.addSubcommand(sub.definition.data));
  //       return group;
  //     }),
  // },
  definition: (() => {
    const cmd = new SlashCommandBuilder()
      .setName('ags')
      .setDescription('Comandos relacionados a la AGS');
    subs.forEach(sub => cmd.addSubcommand(sub.definition.data));

    return {
      kind: 'SubsOnly',
      data: cmd,
    };
  })(),

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
