import SystemLog from '@/lib/structures/SystemLog';
import Utils from '@/lib/Utils';
import AgsService from '@/services/AgsService';
import AgsUsersManager from '@/services/AgsUsersManager';
import type { IMySlashCommand } from '@/types';
import {
  type APIEmbedField,
  EmbedBuilder,
  SlashCommandSubcommandBuilder
} from 'discord.js';

const logger = new SystemLog('modules', 'm_ags', 'commands', 'loadcode');

export default {
  definition: {
    kind: 'ImSubCommand',
    data: new SlashCommandSubcommandBuilder()
      .setName('loadcode')
      .setDescription('Carga un codigo de la ags')
      .addStringOption(option =>
        option
          .setName('code')
          .setDescription('El codigo a cargar')
          .setRequired(true)
          .setMinLength(5)
      )
      .addStringOption(option =>
        option
          .setName('para')
          .setDescription('Para quien es el codigo')
          .setRequired(true)
          .addChoices([
            { name: 'Todos', value: 'all' },
            { name: 'Un usuario (usar opcion "user")', value: 'user' },
            { name: 'yo', value: 'me' }
          ])
      )
      .addBooleanOption(option =>
        option
          .setName('force')
          .setDescription('Fuerza la carga del codigo (SALTEA LOS CHEQUEOS)')
          .setRequired(false)
      )
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('El usuario al que se le cargara el codigo')
          .setRequired(false)
      )
  },

  async run(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const _code = interaction.options.getString('code', true);
    const _para = interaction.options.getString('para', true) as
      | 'all'
      | 'user'
      | 'me';
    const _force = interaction.options.getBoolean('force', false) ?? false;
    const _user = interaction.options.getUser('user', false);

    const resultsEmbed = new EmbedBuilder()
      .setTitle(`Cargando codigo...${_force ? ' (Forzado)' : ''}`)
      .setAuthor({ name: _code })
      .setFooter({ text: 'NochtTests' })
      .setColor('DarkRed')
      .setTimestamp();

    if (_para === 'user' && !_user) {
      void Utils.embedReply(interaction, {
        title: 'Error',
        description: 'Debes especificar un usuario con la opcion "user"',
        color: 'Red',
        footer: { text: 'NochtTests' }
      });
      return;
    }

    switch (_para) {
      case 'all':
        {
          const allUsersData = await AgsUsersManager.getUsersTokens();
          const allResults: string[] = [];

          if (!allUsersData || allUsersData.length === 0) {
            void Utils.embedReply(interaction, {
              title: 'Error',
              description: 'No hay usuarios registrados',
              color: 'Red',
              footer: { text: 'NochtTests' }
            });
            return;
          }

          async function updateEmbed(end = false): Promise<void> {
            try {
              const theResult = allResults.join('\n');
              resultsEmbed.setDescription(
                theResult.slice(0, 4090) +
                  (theResult.length > 4090 ? '...' : '')
              );

              if (end) {
                resultsEmbed.setTitle(
                  `Codigo cargado correctamente${_force ? ' (Forzado)' : ''}`
                );
                resultsEmbed.setColor('Green');
              }
              await interaction.editReply({
                embeds: [resultsEmbed]
              });
            } catch (error) {
              logger.error('run', 'Error al editar el mensaje', error);
            }
          }

          const updateEmbedInterval = setInterval(updateEmbed, 3000);

          logger.debug(
            'run',
            `Cargando codigo "${_code}" para todos los usuarios ${
              _force ? '(Forzado)' : ''
            }`
          );

          await AgsService.loadCodeForAll(
            allUsersData,
            _code,
            _force,
            async function loadCallBack(agsUserData, response): Promise<void> {
              const format = `- < ${agsUserData.me()} > ${AgsService.parseResponseText(
                response
              )}`;

              allResults.push(format); // += `${format}\n`;
            }
          );

          await Utils.getRandomSleep(2000);
          clearInterval(updateEmbedInterval);
          await Utils.getRandomSleep(3000);

          await updateEmbed(true);
        }
        break;
      case 'user':
      case 'me':
        {
          const agsUserData = await AgsUsersManager.getUserToken({
            ds_id: _para === 'me' ? interaction.user.id : _user?.id
          });

          if (!agsUserData) {
            void Utils.embedReply(interaction, {
              title: 'Error',
              description: 'No se encontro el usuario',
              color: 'Red',
              footer: { text: 'NochtTests' }
            });
            return;
          }

          logger.debug(
            'run',
            `Cargando codigo "${_code}" para el usuario "${
              _para === 'me' ? interaction.user.id : _user?.id
            }" ${_force ? '(Forzado)' : ''}`
          );

          const response = await AgsService.loadCodeForOne(agsUserData, _code);
          const format = `- < ${agsUserData.me()} > ${AgsService.parseResponseText(
            response
          )}`;

          void Utils.embedReply(interaction, {
            author: { name: _code },
            title: `Codigo cargado correctamente${_force ? ' (Forzado)' : ''}`,
            description: format,
            color: 'Green',
            footer: { text: 'NochtTests' }
          });
        }
        break;
    }
  }
} satisfies IMySlashCommand;
