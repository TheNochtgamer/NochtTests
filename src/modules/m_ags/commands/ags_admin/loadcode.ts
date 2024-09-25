import SystemLog from '@/lib/structures/SystemLog';
import Utils from '@/lib/Utils';
import AgsService from '@/services/AgsService';
import AgsUsersManager from '@/services/AgsUsersManager';
import type {
  AgsUserData,
  IAgsRewardPageResponse,
  IMySlashCommand
} from '@/types';
import {
  EmbedBuilder,
  Message,
  SlashCommandSubcommandBuilder,
  type TextBasedChannel
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
      .addStringOption(option =>
        option
          .setName('reference')
          .setDescription('La referencia a cargarle el codigo')
          .setRequired(false)
          .setAutocomplete(true)
      )
  },

  async run(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const _code = interaction.options.getString('code', true);
    const _force = interaction.options.getBoolean('force', false) ?? false;
    const _user = interaction.options.getUser('user', false);
    const _reference = interaction.options.getString('reference', false);

    const formatThis = (
      agsUserData: AgsUserData,
      response: IAgsRewardPageResponse | null
    ) => `- ${agsUserData.me()} :> ${AgsService.parseResponseText(response)}`;

    // Cargar codigo para TODAS LAS CUENTAS
    if (!_user && !_reference) {
      const result = await AgsService.sendCode({
        code: _code,
        force: _force
      });

      if (result === 1) {
        void Utils.embedReply(interaction, {
          title: 'Error',
          description: 'No hay usuarios registrados',
          color: 'Red',
          footer: { text: 'NochtTests' }
        });
        return;
      }

      void Utils.embedReply(interaction, {
        author: { name: _code },
        title: `Codigo cargado correctamente${_force ? ' (Forzado)' : ''}`,
        color: 'Green',
        footer: { text: 'NochtTests' }
      });
    }

    // Cargar codigo PARA 1 CUENTA
    if (_user || _reference) {
      const agsUserData = await AgsUsersManager.getUserToken({
        ds_id: _user?.id,
        reference: _reference || undefined
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
          _user?.id || _reference
        }" ${_force ? '(Forzado)' : ''}`
      );

      const response = await AgsService.redeemCodeForOne(agsUserData, _code);

      void Utils.embedReply(interaction, {
        author: { name: _code },
        title: `Codigo cargado correctamente${_force ? ' (Forzado)' : ''}`,
        description: formatThis(agsUserData, response),
        color: 'Green',
        footer: { text: 'NochtTests' }
      });
    }
  }
} satisfies IMySlashCommand;
