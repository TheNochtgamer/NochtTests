import type { MySlashCommand } from '../types';
import { SlashCommandBuilder } from 'discord.js';
import { setTimeout } from 'node:timers/promises';
import utils from '../lib/Utils';

export default {
  data: new SlashCommandBuilder()
    .setName('dados')
    .setDescription('TIRAR LOS DADOS'),

  async run(interaction) {
    const dado1 = Math.floor(Math.random() * 6) + 1;
    const sleep = setTimeout;
    // const dado2 = Math.floor(Math.random() * 6) + 1;

    await interaction.reply(`Tirando los dados...`);

    await sleep(3000);

    await interaction.editReply(
      `El dado de ${interaction.member?.user?.username}: ${dado1}`
    );
  },
} satisfies MySlashCommand;
