import type { IMySlashCommand } from '@/types';
import { SlashCommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';
import AgsUsersManager from '@/services/AgsUsersManager';
import AgsUserData from '@/lib/structures/AGS/AgsUserData';

export default {
  definition: {
    kind: 'OptionsOnly',
    data: new SlashCommandBuilder()
      .setName('linked')
      .setDescription('Obtiene las cuentas vinculadas al bot')
      .addStringOption(option =>
        option
          .setName('opciones')
          .setDescription('De donde sacar obtener los datos')
          .setRequired(true)
          .setChoices([
            { name: 'Todos', value: 'all' },
            { name: 'Un usuario (usar opcion "user")', value: 'user' },
            { name: 'Referencia (usar opcion "reference")', value: 'reference' }
          ])
      )
      .addStringOption(option =>
        option
          .setName('reference')
          .setDescription('Referencia de la cuenta a ver')
          .setAutocomplete(true)
          .setRequired(false)
      )
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('Usuario a ver')
          .setRequired(false)
      )
  },

  async autoComplete(interaction) {
    return [];
  },

  async run(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const _opciones = interaction.options.getString('opciones', true) as
      | 'all'
      | 'user'
      | 'reference';
    const _reference = interaction.options.getString('reference', false);
    const _user = interaction.options.getUser('user', false);

    switch (_opciones) {
      case 'all':
        {
          const agsUsersData = await AgsUsersManager.getUsersTokens();
          if (!agsUsersData) {
            Utils.embedReply(interaction, {
              title: 'Error',
              description: 'No se encontraron datos',
              color: 'Red',
              footer: { text: 'NochtTests' },
              timestamp: new Date()
            });
            return;
          }

          const content = agsUsersData.map(agsUser => {
            agsUser.token = '';

            return '- ' + agsUser.toString();
          });

          Utils.embedReply(interaction, {
            title: 'Datos',
            description: content.join('\n'),
            color: 'White',
            footer: { text: 'NochtTests' },
            timestamp: new Date()
          });
        }
        break;
      case 'reference':
      case 'user': {
        if (!_user && !_reference) {
          Utils.embedReply(interaction, {
            title: 'Error',
            description: 'Debes especificar un usuario o referencia',
            color: 'Red',
            footer: { text: 'NochtTests' },
            timestamp: new Date()
          });
          return;
        }

        const agsUser = await AgsUsersManager.getUserToken({
          ds_id: _user?.id,
          reference: _reference ?? 'self'
        });

        if (!agsUser) {
          Utils.embedReply(interaction, {
            title: 'Error',
            description: 'No se encontraron datos',
            color: 'Red',
            footer: { text: 'NochtTests' },
            timestamp: new Date()
          });
          return;
        }

        Utils.embedReply(interaction, {
          title: 'Datos',
          description: '- ' + agsUser.toString(),
          color: 'White',
          footer: { text: 'NochtTests' },
          timestamp: new Date()
        });
      }
    }
  }
} satisfies IMySlashCommand;
