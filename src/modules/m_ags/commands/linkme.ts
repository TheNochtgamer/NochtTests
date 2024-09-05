import type { IMySlashCommand } from '@/types';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';
import AgsUsersManager from '@/services/AgsUsersManager';
import AgsService from '@/services/AgsService';

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
      void Utils.embedReply(interaction, {
        title: 'Error',
        description: 'La pagina no respondio, intenta de nuevo mas tarde',
        color: 'Red',
        footer: { text: 'AgsCodeSniper' },
      });
      return;
    }

    if (typeof test === 'string') {
      void Utils.embedReply(interaction, {
        title: 'Error',
        description: `La pagina respondio con: \`${test}\``,
        color: 'Red',
        footer: { text: 'AgsCodeSniper' },
      });
      return;
    }

    // TODO Añadir mensaje cuando hubo error con la base de datos
    if (userToken) {
      await AgsUsersManager.updateUserToken({
        user_id: userToken.user_id,
        ds_id: interaction.user.id,
        token,
        reference: 'self',
        priority: 0,
      });
    } else {
      await AgsUsersManager.createUserToken({
        ds_id: interaction.user.id,
        reference: 'self',
        priority: 0,
        token,
      });
    }

    void Utils.embedReply(interaction, {
      title: 'Exito',
      description:
        'Token vinculado correctamente\nMuchas gracias por usar mi sistema, si me queres dar una mano monetariamente, podes hacerlo en https://cafecito.app/thenochtgamer.',
      color: 'Green',
      footer: { text: 'AgsCodeSniper' },
    });
  },
} satisfies IMySlashCommand;
