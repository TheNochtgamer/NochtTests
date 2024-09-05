import type { IMySlashCommand } from '@/types';
import {
  type ApplicationCommandSubCommand,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import utils from '@/lib/Utils';

export default {
  definition: {
    kind: 'OptionsOnly',
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Ver los comandos disponibles'),
  },
  deferIfToLate: {
    defer: true,
    ephemeral: false,
  },

  async run(interaction) {
    // FIXME
    const embed = new EmbedBuilder().setColor('Random').setTitle('Comandos');
    const commands = process.env.GUILDID
      ? await interaction.guild?.commands.fetch()
      : await interaction.client.application.commands.fetch();
    const filteredCommands = [];

    if (!commands) {
      await interaction.reply({
        embeds: [embed],
      });
      return;
    }

    for (const command of commands.values()) {
      const clientCommand = interaction.client.commands.get(command.name);
      if (
        clientCommand &&
        (await utils.authorizationCheck(interaction, clientCommand))
      ) {
        filteredCommands.push(command);
      }
    }

    const str = filteredCommands
      .map(command => {
        const subs = command.options.filter(
          opt => opt.type === 1
        ) as unknown as ApplicationCommandSubCommand[];

        return subs.length
          ? subs
              .map(
                sub =>
                  `> </${command.name} ${sub.name}:${command.id}> ${
                    sub.options
                      ?.map(opt =>
                        opt.required ? `<${opt.name}>` : `[${opt.name}]`
                      )
                      ?.join(' ') ?? ''
                  } -- ${sub.description}`
              )
              .join('\n')
          : `> </${command.name}:${command.id}> ${command.options
              .map((opt: any) =>
                opt.required ? `<${opt.name}>` : `[${opt.name}]`
              )
              .join(' ')} -- ${command.description}`;
      })
      .join('\n');

    embed.setDescription(str || null);

    // await interaction.reply({
    //   embeds: [embed],
    // });
    void utils.embedReply(interaction, embed);
  },
} satisfies IMySlashCommand;
