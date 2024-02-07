import type { Bot, DisabledCommand } from '../../types';
import {
  type CommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import utils from '../../lib/Utils';
import usersManager from '../../services/UsersManager';
import guildsManager from '../../services/GuildsManager';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('disable')
    .setDescription('Deshabilita un comando')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('Nombre del comando')
        .setAutocomplete(true)
        .setRequired(true)
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
          }
        )
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Razon de deshabilitacion')
    )
    .addStringOption(option =>
      option.setName('id').setDescription('ID del usuario o guild')
    ),

  async run(interaction: CommandInteraction & { client: Bot }) {
    const commandName = interaction.options.get('command', true)
      .value as string;
    const type = interaction.options.get('type', true).value as
      | 'user'
      | 'guild'
      | 'global';
    const reason = interaction.options.get('reason')?.value as
      | string
      | undefined;
    const id = interaction.options.get('id')?.value as string | undefined;

    if ((type === 'user' || type === 'guild') && !utils.validateId(id)) {
      await interaction.reply({
        content: `Debes ingresar una ID valida de un ${
          type === 'user' ? 'usuario' : 'guild'
        }`,
        ephemeral: true,
      });
      return;
    }

    switch (type) {
      case 'user': {
        if (!id) return;
        const dC = usersManager.getUserData(id).disabledCommands;

        if (dC.some(c => c.name === commandName)) {
          dC.splice(
            dC.findIndex(c => c.name === commandName),
            1
          );

          await interaction.reply({
            content: `El comando \`${commandName}\` ha sido habilitado para el usuario <@${id}>`,
            ephemeral: true,
          });
          return;
        }

        dC.push({
          name: commandName,
          reason,
        } satisfies DisabledCommand);

        await interaction.reply({
          content: `El comando \`${commandName}\` ha sido deshabilitado para el usuario <@${id}>`,
          ephemeral: true,
        });
        break;
      }

      case 'guild': {
        if (!id) return;
        const dC = guildsManager.getGuildData(id).disabledCommands;

        if (dC.some(c => c.name === commandName)) {
          dC.splice(
            dC.findIndex(c => c.name === commandName),
            1
          );

          await interaction.reply({
            content: `El comando \`${commandName}\` ha sido habilitado en el servidor <@${id}>`,
            ephemeral: true,
          });
          return;
        }

        dC.push({
          name: commandName,
          reason,
        } satisfies DisabledCommand);

        await interaction.reply({
          content: `El comando \`${commandName}\` ha sido deshabilitado en el servidor <@${id}>`,
          ephemeral: true,
        });
        break;
      }

      default: {
        const dC = interaction.client.settings.disabledCommands;
        if (dC.some(c => c.name === commandName)) {
          dC.splice(
            dC.findIndex(c => c.name === commandName),
            1
          );

          await interaction.reply({
            content: `El comando \`${commandName}\` ha sido habilitado en el contexto global`,
            ephemeral: true,
          });
          return;
        }

        dC.push({
          name: commandName,
          reason,
        } satisfies DisabledCommand);

        await interaction.reply({
          content: `El comando \`${commandName}\` ha sido deshabilitado en el contexto global`,
          ephemeral: true,
        });

        break;
      }
    }
  },
};
