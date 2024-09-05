import type { IMySlashCommand } from '@/types';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';
import AgsUsersManager from '@/services/AgsUsersManager';
import AgsService from '@/services/AgsService';
import SystemLog from '@/lib/structures/SystemLog';

const logger = new SystemLog('modules', 'm_ags', 'commands', 'linkme');

export default {
  definition: {
    kind: 'ImSubCommand',
    data: new SlashCommandSubcommandBuilder()
      .setName('linkme')
      .setDescription('Linkea tu token de la pagina con el bot')
      .addStringOption(option =>
        option
          .setName('token')
          .setDescription('El token que te da el script (NO COMPARTIR)')
          .setRequired(true)
          .setMinLength(10)
      ),
  },

  async run(interaction) {
    const token = interaction.options.getString('token', true).toLowerCase();
    await interaction.deferReply({ ephemeral: true });

    const userToken = await AgsUsersManager.getUserToken({
      ds_id: interaction.user.id,
      reference: 'self',
    });

    if (userToken) {
      const action = await Utils.confirmationForm(
        interaction,
        'Ya tienes un token vinculado, deseas reemplazarlo?'
      );
      if (action) {
        await interaction.deleteReply();
        return;
      }
    }

    const test = await AgsService.testToken(token);

    if (test === 1) {
      logger.debug(
        'run',
        `${interaction.user.id} > Error al intentar vincular token, la pagina no respondio`
      );

      void Utils.embedReply(interaction, {
        title: 'Error',
        description: 'La pagina no respondio, intenta de nuevo mas tarde',
        color: 'Red',
        footer: { text: 'AgsCodeSniper' },
      });
      return;
    }

    if (typeof test === 'string') {
      logger.debug(
        'run',
        `${interaction.user.id} > Error al intentar vincular token, la pagina respondio con: ${test}`
      );
      void Utils.embedReply(interaction, {
        title: 'Error',
        description: `La pagina respondio con: \`${test}\``,
        color: 'Red',
        footer: { text: 'AgsCodeSniper' },
      });
      return;
    }

    let res;
    if (userToken) {
      res = await AgsUsersManager.updateUserToken({
        user_id: userToken.user_id,
        ds_id: interaction.user.id,
        token,
        reference: 'self',
        priority: 0,
      });
    } else {
      res = await AgsUsersManager.createUserToken({
        ds_id: interaction.user.id,
        reference: 'self',
        priority: 0,
        token,
      });
    }

    if (!res) {
      logger.error(
        'run',
        `${interaction.user.id} > Error al intentar almacenar token, no se guardo el nuevo token`
      );
    }

    logger.debug(
      'run',
      `${interaction.user.id} > Token vinculado correctamente`
    );
    void Utils.embedReply(interaction, {
      title: `Exito${!res ? ' (A medias)' : ''}`,
      description: `Token vinculado correctamente${
        !res
          ? '\npero el token no fue almacenado, avisale a Nocht. Igualmente...'
          : ''
      }\nMuchas gracias por usar mi sistema, si me queres dar una mano monetariamente, podes hacerlo en https://cafecito.app/thenochtgamer.`,
      color: 'Green',
      footer: { text: 'AgsCodeSniper' },
    });
  },
} satisfies IMySlashCommand;
