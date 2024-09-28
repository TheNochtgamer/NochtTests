import type { IMySlashCommand } from '@/types';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';
import AgsUsersManager from '@/services/AgsUsersManager';
import SystemLog from '@/lib/structures/SystemLog';

const logger = new SystemLog('modules', 'm_ags', 'commands', 'unlinkme');

export default {
  definition: {
    kind: 'ImSubCommand',
    data: new SlashCommandSubcommandBuilder()
      .setName('unlinkme')
      .setDescription('Desvincula tu token de pagina con el bot')
  },

  async run(interaction) {
    const userToken = await AgsUsersManager.getUserToken({
      ds_id: interaction.user.id
    });

    if (!userToken) {
      void Utils.embedReply(interaction, {
        title: 'Error',
        description: 'No tienes un token vinculado',
        color: 'Red',
        footer: { text: 'NochtTests' }
      });
    }

    const resultConf = await Utils.confirmationForm(
      interaction,
      '¿Estas seguro de querer desvincular tu token?\nIgualmente podras volver a vincularlo en cualquier momento'
    );

    if (resultConf) {
      await interaction.deleteReply();
      return;
    }

    const result = await AgsUsersManager.deleteUserToken({
      ds_id: interaction.user.id
    });

    switch (result) {
      case 0:
        logger.debug(
          'run',
          `${interaction.user.id} > Token desvinculado correctamente`
        );
        void Utils.embedReply(interaction, {
          title: 'Exito',
          description:
            'Tu token ha sido desvinculado correctamente\nMuchas gracias por usar mi servicio',
          color: 'Green',
          footer: { text: 'NochtTests' }
        });
        break;
      case 1:
        void Utils.embedReply(interaction, {
          title: 'Error',
          description: 'No tienes un token vinculado',
          color: 'Red',
          footer: { text: 'NochtTests' }
        });
        break;
      default:
        void Utils.embedReply(interaction, {
          title: 'Error',
          description: 'Ocurrio un error inesperado\nPrueba más tarde...',
          color: 'Red',
          footer: { text: 'NochtTests' }
        });
        break;
    }
  }
} satisfies IMySlashCommand;
