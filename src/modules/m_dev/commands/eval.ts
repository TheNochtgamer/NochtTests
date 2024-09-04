/* eslint-disable @typescript-eslint/no-unused-vars */
import type { IMySlashCommand } from '@/types';
import { SlashCommandSubcommandBuilder } from 'discord.js';
import utils from '@/lib/Utils';
import SystemLog from '@/lib/structures/SystemLog';

const logger = new SystemLog('modules', 'dev', 'commands', 'eval');

export default {
  definition: {
    kind: 'ImSubCommand',
    data: new SlashCommandSubcommandBuilder()
      .setName('eval')
      .setDescription('Dev command')
      .addStringOption(opt =>
        opt
          .setName('codigo')
          .setDescription('El codigo a evaluar')
          .setRequired(true)
      ),
  },

  async run(interaction) {
    let runme = interaction.options.get('codigo', true).value as string;

    if (runme.match(/process/gi))
      runme = 'throw new Error("You cannot use the variable process");';
    if (runme.match(/token/gi))
      runme = 'throw new Error("You cannot get the token");';

    logger.log('run', `${interaction.user.username} esta ejecutando codigo...`);

    // shortcuts
    const client = interaction.client;
    const bot = interaction.client;
    const channel = interaction.channel;
    const guild = interaction.guild;

    const appId = interaction.applicationId;
    const member = interaction.member;
    const members = guild?.members;
    const roles = guild?.roles;
    const channels = guild?.channels;
    const emojis = guild?.emojis;

    const messages = channel?.messages;
    //

    await interaction.deferReply({ ephemeral: true });
    try {
      // eslint-disable-next-line no-eval
      const result = await eval(runme);

      await utils.embedReply(interaction, {
        title: 'Resultado',
        description: `\`\`\`json\n${JSON.stringify(
          result || '',
          null,
          2
        )}\`\`\``,
        color: 'Green',
      });
    } catch (err) {
      await utils.embedReply(interaction, {
        title: 'Error',
        description: `\`\`\`json\n${err}\`\`\``,
        color: 'Red',
      });
    }

    logger.log(
      'run',
      `${interaction.user.username} termino de ejecutar codigo.`
    );
  },
} satisfies IMySlashCommand;
