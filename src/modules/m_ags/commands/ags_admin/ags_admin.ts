import type { IMyCommandDataImSubCommand, IMySlashCommand } from '@/types';
import { PermissionsBitField, SlashCommandBuilder } from 'discord.js';

import loadcode from './loadcode';
import link_other from './link_other';
import link_someone from './link_someone';
import linkeds from './linkeds';
import unlink_other from './unlink_other';
import unlink_someone from './unlink_someone';

const subs = new Map<string, IMySlashCommand<IMyCommandDataImSubCommand>>([
  ['loadcode', loadcode],
  ['link_other', link_other],
  ['link_someone', link_someone],
  ['linkeds', linkeds],
  ['unlink_other', unlink_other],
  ['unlink_someone', unlink_someone]
]);

export default {
  roles_req: [
    '1119395999027314748',
    '1126211569911607500',
    '1285735468511531090'
  ],
  allRoles_req: false,

  // definition: {
  //   kind: 'SubsOnly',
  //   data: new SlashCommandBuilder()
  //     .setName('ags')
  //     .setDescription('Comandos relacionados a la AGS')
  //     .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
  //     .addSubcommandGroup(group => {
  //       subs.forEach(sub => group.addSubcommand(sub.definition.data));
  //       return group;
  //     }),
  // },

  definition: (() => {
    const cmd = new SlashCommandBuilder()
      .setName('ags_admin')
      .setDescription('Comandos relacionados a la AGS')
      .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers);
    subs.forEach(sub => cmd.addSubcommand(sub.definition.data));

    return {
      kind: 'SubsOnly',
      data: cmd
    };
  })(),

  async autoComplete(interaction) {
    const subCommand = interaction.options.getSubcommand(true);
    if (!subs.get(subCommand)?.autoComplete)
      return [{ name: 'error', value: 'error' }];
    return (
      // @ts-expect-error Ya se hace el correspondiente chequeo
      (await subs.get(subCommand)?.autoComplete(interaction)) ?? [
        {
          name: 'error',
          value: 'error'
        }
      ]
    );
  },

  async run(interaction) {
    const subCommand = interaction.options.getSubcommand(true);
    await subs.get(subCommand)?.run(interaction);
  }
} satisfies IMySlashCommand;
