import type { IMySlashCommand } from '@/types';
import { SlashCommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';
import KickChatService from '@/services/KickChatService';

export default {
  roles_req: [
    '1119395999027314748',
    '1126211569911607500',
    '1285735468511531090'
  ],
  allRoles_req: false,

  definition: {
    kind: 'SubsOnly',
    data: new SlashCommandBuilder()
      .setName('kickstream')
      .setDescription('Comandos para utilizar en la pagina de kick')
      .addSubcommand(sub =>
        sub.setName('start').setDescription('Prende el watcher de kick')
      )
      .addSubcommand(sub =>
        sub.setName('stop').setDescription('Apaga el watcher de kick')
      )
      .addSubcommand(sub =>
        sub.setName('status').setDescription('Estado del watcher de kick')
      )
  },

  async run(interaction) {
    const subCommand = interaction.options.getSubcommand(true);

    switch (subCommand) {
      case 'start':
        KickChatService.start();
        Utils.embedReply(interaction, {
          title: 'Watcher de kick prendido',
          description: 'El watcher de kick ha sido prendido',
          color: 'Green'
        });
        break;
      case 'stop':
        KickChatService.stop();
        Utils.embedReply(interaction, {
          title: 'Watcher de kick apagado',
          description: 'El watcher de kick ha sido apagado',
          color: 'Red'
        });
        break;
      case 'status':
        Utils.embedReply(interaction, {
          title: 'Estado del watcher de kick',
          description: `El watcher de kick esta ${
            KickChatService.status ? 'prendido' : 'apagado'
          }`,
          color: KickChatService.status ? 'Green' : 'Red'
        });
        break;
    }
  }
} satisfies IMySlashCommand;
