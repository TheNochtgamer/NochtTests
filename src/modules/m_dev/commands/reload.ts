import type { IMySlashCommand } from '@/types';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import utils from '@/lib/Utils';
import SystemLog from '@/lib/structures/SystemLog';

const logger = new SystemLog('modules', 'm_dev', 'commands', 'reload');

export default {
  definition: {
    kind: 'ImSubCommand',
    data: new SlashCommandSubcommandBuilder()
      .setName('reloadall')
      .setDescription('Recarga todos los comandos'),
    // .addBooleanOption(option =>
    //   option
    //     .setName('forceupload')
    //     .setDescription('Forzar subida de comandos')
    // ),
  },

  async run(interaction) {
    // const forceUpload = interaction.options.get('forceupload')?.value ?? false;

    const confirm = await utils.confirmationForm(
      interaction,
      '¿Estas seguro de recargar los comandos y eventos?'
    );

    if (confirm) {
      await interaction.deleteReply();
      return;
    }

    logger.log(
      'run',
      `${interaction.user.username} esta recargando los archivos...`
    );
    await interaction.editReply({
      content: `Recargando archivos, porfavor espera...`,
    });

    await Promise.allSettled([
      interaction.client.loadEvents(true),
      interaction.client.loadCommands(true),
    ]);

    // utils.deleteMyRequire();

    // if (
    //   forceUpload ||
    //   (await utils.checkSyncedCommands(interaction.client)) === 0
    // )
    //   await utils.summitCommands(interaction.client);

    await interaction.editReply({
      content: `Recarga de archivos terminada.`,
    });

    logger.log('run', `Recarga de archivos terminada.`);
  },
} satisfies IMySlashCommand;
