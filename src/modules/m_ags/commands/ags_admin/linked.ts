import type { IMySlashCommand } from '@/types';
import { SlashCommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';

export default {
  definition: {
    kind: 'OptionsOnly',
    data: new SlashCommandBuilder()
      .setName('linked')
      .setDescription('Obtiene las cuentas vinculadas al bot')
  },

  async run(interaction) {}
} satisfies IMySlashCommand;
