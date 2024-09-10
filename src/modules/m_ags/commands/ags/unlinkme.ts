import type { IMySlashCommand } from '@/types';
import { SlashCommandBuilder } from 'discord.js';
import Utils from '@/lib/Utils';

export default {
  definition: {
    kind: 'OptionsOnly',
    data: new SlashCommandBuilder().setName('unlinkme').setDescription('.')
  },

  async run(interaction) {}
} satisfies IMySlashCommand;
