import type { IMySlashCommand } from '../../types';
import { SlashCommandBuilder } from 'discord.js';
import Utils from '../../lib/Utils';

export default {
  definition: {
    kind: 'OptionsOnly',
    data: new SlashCommandBuilder()
      .setName('linkme')
      .setDescription('Link your account to the bot'),
  },

  async run(interaction) {},
} satisfies IMySlashCommand;
