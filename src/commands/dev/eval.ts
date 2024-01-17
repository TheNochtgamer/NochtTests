import type { Bot } from '../../types';
import {
  type CommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import utils from '../../lib/Utils';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('eval')
    .setDescription('Dev command')
    .addStringOption(opt =>
      opt
        .setName('codigo')
        .setDescription('El codigo a evaluar')
        .setRequired(true),
    ),

  async run(interaction: CommandInteraction & { client: Bot }) {
    const code = (interaction.options.get('codigo', true).value as string)
      .replace(/token/i, '')
      .replace(/env/i, '');

    console.log(`${interaction.user.username} esta ejecutando codigo...`);

    // vars
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
      const result = await eval(code);

      await utils.embedReply(interaction, {
        title: 'Resultado',
        description: `\`\`\`json\n${JSON.stringify(
          result || '',
          null,
          2,
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

    console.log(`${interaction.user.username} termino de ejecutar codigo.`);
  },
};
