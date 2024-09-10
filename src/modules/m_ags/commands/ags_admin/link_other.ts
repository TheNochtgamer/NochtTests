import type { IMySlashCommand } from '@/types';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';
import AgsUsersManager from '@/services/AgsUsersManager';
import AgsService from '@/services/AgsService';
import SystemLog from '@/lib/structures/SystemLog';
import UsersManager from '@/services/UsersManager';

const logger = new SystemLog('modules', 'm_ags', 'commands', 'link_other');

export default {
  definition: {
    kind: 'ImSubCommand',
    data: new SlashCommandSubcommandBuilder()
      .setName('link_other')
      .setDescription('Linkea otro usuario con un token al bot')
      .addStringOption(option =>
        option
          .setName('token')
          .setDescription('El token que te da el script (NO COMPARTIR)')
          .setRequired(true)
          .setMinLength(10)
      )
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('El usuario al que se le vinculara el token')
          .setRequired(true)
      ),
  },

  async run(interaction) {
    const token = interaction.options.getString('token', true).toLowerCase();
    const user = interaction.options.getUser('user', true);
    await interaction.deferReply({ ephemeral: true });

    const userToken = await AgsUsersManager.getUserToken({
      ds_id: user.id,
      reference: 'self',
    });

    if (userToken) {
      const action = await Utils.confirmationForm(
        interaction,
        `<@${user.id}> > Ya tiene un token vinculado, deseas reemplazarlo?`,
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
        `${user.id} > Error al intentar vincular token, la pagina no respondio`,
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
        `${user.id} > Error al intentar vincular token, la pagina respondio con: ${testResult}`,
      );
      void Utils.embedReply(interaction, {
        title: 'Error',
        description: `La pagina respondio con: \`${testResult}\``,
        color: 'Red',
        footer: { text: 'AgsCodeSniper' },
      });
      return;
    }

    // Esto debido a la foreing key, una vez se utiliza, crea un record en la tabla de usuarios
    await UsersManager.getUserData(user.id);

    let res;
    if (userToken) {
      res = await AgsUsersManager.updateUserToken({
        user_id: userToken.user_id,
        ds_id: user.id,
        token,
        reference: 'self',
        priority: 0,
      });
    } else {
      res = await AgsUsersManager.createUserToken({
        ds_id: user.id,
        reference: 'self',
        priority: 0,
        token,
      });
    }

    if (!res) {
      logger.error(
        'run',
        `${user.id} > Error al intentar almacenar token, no se guardo el nuevo token`,
      );
    }

    logger.debug('run', `${user.id} > Token vinculado correctamente`);
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
