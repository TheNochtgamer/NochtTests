import type { IMySlashCommand } from '@/types';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';
import AgsUsersManager from '@/services/AgsUsersManager';
import SystemLog from '@/lib/structures/SystemLog';

const logger = new SystemLog('modules', 'm_ags', 'commands', 'unlink_someone');

export default {
  definition: {
    kind: 'ImSubCommand',
    data: new SlashCommandSubcommandBuilder()
      .setName('unlink_someone')
      .setDescription('Desvincula el token de una referencia del bot')
      .addStringOption(option =>
        option
          .setName('reference')
          .setDescription('Referencia del usuario a desvincular')
          .setAutocomplete(true)
          .setRequired(true)
      )
  },

  async autoComplete(interaction) {
    return [];
  },

  async run(interaction) {
    const reference = interaction.options.getString('reference', true);

    const result = await AgsUsersManager.deleteUserToken({
      reference
    });

    switch (result) {
      case 0:
        logger.debug(
          'run',
          `${interaction.user.id} > Token de ${reference} desvinculado correctamente`
        );
        void Utils.embedReply(interaction, {
          title: 'Exito',
          description: 'El token ha sido desvinculado correctamente',
          color: 'Green',
          footer: { text: 'NochtTests' }
        });
        break;
      case 1:
        void Utils.embedReply(interaction, {
          title: 'Error',
          description: 'El usuario no tiene un token vinculado',
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
