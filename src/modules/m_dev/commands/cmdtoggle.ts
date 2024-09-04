import type {
  IGlobalDisabledCommand,
  IGuildDisabledCommand,
  IMySlashCommand,
  IUserDisabledCommand,
} from '@/types';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import utils from '@/lib/Utils';
import usersManager from '@/services/UsersManager';
import guildsManager from '@/services/GuildsManager';

export default {
  definition: {
    kind: 'ImSubCommand',
    data: new SlashCommandSubcommandBuilder()
      .setName('cmdtoggle')
      .setDescription('Habilita o deshabilita un comando')
      .addStringOption(option =>
        option
          .setName('command')
          .setDescription('Nombre del comando')
          .setAutocomplete(true)
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('context')
          .setDescription('Contexto de la deshabilitacion')
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
            }
          )
      )
      .addStringOption(option =>
        option.setName('reason').setDescription('Razon de deshabilitacion')
      )
      .addStringOption(option =>
        option.setName('id').setDescription('ID del usuario o guild')
      ),
  },

  autoComplete(interaction) {
    const bot = interaction.client;

    return bot.commands
      .map(c =>
        c.definition.kind !== 'ImSubCommand'
          ? {
              name: c.definition.data.name,
              value: c.definition.data.name,
            }
          : []
      )
      .flat();
  },

  async run(interaction) {
    const commandName = interaction.options.get('command', true)
      .value as string;
    const context = interaction.options.get('context', true).value as
      | 'user'
      | 'guild'
      | 'global';
    const reason = interaction.options.get('reason')?.value as
      | string
      | undefined;
    const id = interaction.options.get('id')?.value as string | undefined;

    if (!interaction.client.commands.has(commandName)) {
      await interaction.reply({
        content: `El comando \`${commandName}\` no existe`,
        ephemeral: true,
      });
      return;
    }

    if ((context === 'user' || context === 'guild') && !utils.validateId(id)) {
      await interaction.reply({
        content: `Debes ingresar una ID valida de un ${
          context === 'user' ? 'usuario' : 'guild'
        }`,
        ephemeral: true,
      });
      return;
    }

    switch (context) {
      case 'user': {
        if (!id) return;
        const dC = (await usersManager.getUserData(id)).disabled_commands;

        if (dC.some(c => c.cmd_name === commandName)) {
          dC.splice(
            dC.findIndex(c => c.cmd_name === commandName),
            1
          );

          await interaction.reply({
            content: `El comando \`${commandName}\` ha sido habilitado para el usuario <@${id}>`,
            ephemeral: true,
          });
          return;
        }

        dC.push({
          ds_id: id,
          cmd_name: commandName,
          type: 'user',
          reason,
        } satisfies IUserDisabledCommand);

        await interaction.reply({
          content: `El comando \`${commandName}\` ha sido deshabilitado para el usuario <@${id}>`,
          ephemeral: true,
        });
        break;
      }

      case 'guild': {
        if (!id) return;
        const dC = (await guildsManager.getGuildData(id)).disabled_commands;

        if (dC.some(c => c.cmd_name === commandName)) {
          dC.splice(
            dC.findIndex(c => c.cmd_name === commandName),
            1
          );

          await interaction.reply({
            content: `El comando \`${commandName}\` ha sido habilitado en el servidor <@${id}>`,
            ephemeral: true,
          });
          return;
        }

        dC.push({
          ds_id: id,
          cmd_name: commandName,
          type: 'guild',
          reason,
        } satisfies IGuildDisabledCommand);

        await interaction.reply({
          content: `El comando \`${commandName}\` ha sido deshabilitado en el servidor <@${id}>`,
          ephemeral: true,
        });
        break;
      }

      default: {
        const dC = interaction.client.settings.disabled_commands;
        if (dC.some(c => c.cmd_name === commandName)) {
          dC.splice(
            dC.findIndex(c => c.cmd_name === commandName),
            1
          );

          await interaction.reply({
            content: `El comando \`${commandName}\` ha sido habilitado en el contexto global`,
            ephemeral: true,
          });
          return;
        }

        dC.push({
          cmd_name: commandName,
          type: 'global',
          reason,
        } satisfies IGlobalDisabledCommand);

        await interaction.reply({
          content: `El comando \`${commandName}\` ha sido deshabilitado en el contexto global`,
          ephemeral: true,
        });

        break;
      }
    }
  },
} satisfies IMySlashCommand;
