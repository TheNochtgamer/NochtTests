import type { IMySlashCommand } from '@/types';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';
import AgsUsersManager from '@/services/AgsUsersManager';
import AgsService from '@/services/AgsService';
import SystemLog from '@/lib/structures/SystemLog';

const logger = new SystemLog('modules', 'm_ags', 'commands', 'link_someone');

export default {
  definition: {
    kind: 'ImSubCommand',
    data: new SlashCommandSubcommandBuilder()
      .setName('link_someone')
      .setDescription(
        'Linkea un token de ALGUIEN no presente en ds con el bot en forma de referencia'
      )
      .addStringOption(option =>
        option
          .setName('token')
          .setDescription('El token que te da el script (NO COMPARTIR)')
          .setRequired(true)
          .setMinLength(10)
      )
      .addStringOption(option =>
        option
          .setName('reference')
          .setDescription(
            'Una referencia para el token (ej: nombre de la persona)'
          )
          .setRequired(true)
      ),
  },

  async run(interaction) {
    const token = interaction.options.getString('token', true).toLowerCase();
    const reference = interaction.options.getString('reference', true);
    await interaction.deferReply({ ephemeral: true });

    if (reference === 'self') {
      void Utils.embedReply(interaction, {
        title: 'Error',
        description: 'No puedes usar "self" como referencia',
        color: 'Red',
        footer: { text: 'AgsCodeSniper' },
      });
      return;
    }

    const userToken = await AgsUsersManager.getUserToken({
      reference,
    });

    if (userToken) {
      const action = await Utils.confirmationForm(
        interaction,
        `Ya existe un token vinculado llamado "${reference}", deseas reemplazarlo?`
      );
      if (action) {
        await interaction.deleteReply();
        return;
      }
    }

    const testResult = await AgsService.testToken(token);

    if (testResult === 1) {
      logger.debug(
        'run',
        `"${reference}" > Error al intentar vincular token, la pagina no respondio`
      );

      void Utils.embedReply(interaction, {
        title: 'Error',
        description: 'La pagina no respondio, intenta de nuevo mas tarde',
        color: 'Red',
        footer: { text: 'AgsCodeSniper' },
      });
      return;
    }

    if (typeof testResult === 'string') {
      logger.debug(
        'run',
        `"${reference}" > Error al intentar vincular token, la pagina respondio con: ${testResult}`
      );
      void Utils.embedReply(interaction, {
        title: 'Error',
        description: `La pagina respondio con: \`${testResult}\``,
        color: 'Red',
        footer: { text: 'AgsCodeSniper' },
      });
      return;
    }

    let res;
    if (userToken) {
      res = await AgsUsersManager.updateUserToken({
        user_id: userToken.user_id,
        ds_id: null,
        token,
        reference,
        priority: 0,
      });
    } else {
      res = await AgsUsersManager.createUserToken({
        ds_id: null,
        reference,
        priority: 0,
        token,
      });
    }

    if (!res) {
      logger.error(
        'run',
        `"${reference}" > Error al intentar almacenar token, no se guardo el nuevo token`
      );
    }

    logger.debug('run', `"${reference}" > Token vinculado correctamente`);
    void Utils.embedReply(interaction, {
      title: `Exito${!res ? ' (A medias)' : ''}`,
      description: `Token vinculado correctamente${
        !res
          ? '\npero el token no fue almacenado, avisale a Nocht. Igualmente...'
          : ''
      }\nMuchas gracias por usar mi sistema, si **no** me queres dar una mano monetariamente, no lo hagas y listo capo, que mierda seguis leyendo???.`,
      color: 'Green',
      footer: { text: 'AgsCodeSniper' },
    });
  },
} satisfies IMySlashCommand;
