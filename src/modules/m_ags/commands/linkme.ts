import type { IMySlashCommand } from '@/types';
import { SlashCommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';

export default {
  definition: {
    kind: 'OptionsOnly',
    data: new SlashCommandBuilder()
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
    const opt_token = interaction.options.getString('token', true);
  },
} satisfies IMySlashCommand;
