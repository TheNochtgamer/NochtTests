import type { IMySlashCommand } from '../../../types';
import {
  ChannelType,
  type ColorResolvable,
  EmbedBuilder,
  SlashCommandBuilder,
  type TextBasedChannel,
  Webhook,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Envia un embed')
    .addSubcommand(sub =>
      sub
        .setName('send')
        .setDescription('Envia un embed')
        .addStringOption(option =>
          option
            .setName('edit')
            .setDescription('Link o id del embed que quieras editar')
            .setMinLength(16)
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Canal donde enviar el embed')
        )
        .addStringOption(option =>
          option
            .setName('asyou')
            .setDescription(
              'Envia el embed utilizando tu nombre como autor (*No)'
            )
            .setChoices(
              { name: 'Si', value: 'true' },
              { name: 'No', value: 'false' }
            )
        )
        .addStringOption(option =>
          option.setName('title').setDescription('Titulo del embed')
        )
        .addStringOption(option =>
          option.setName('description').setDescription('Descripcion del embed')
        )
        .addStringOption(option =>
          option
            .setName('color')
            .setDescription('Color del embed en exadecimal (ffffff)')
            .setMinLength(6)
            .setMaxLength(6)
        )
        .addStringOption(option =>
          option.setName('imageurl').setDescription('Url imagen del embed')
        )
        .addStringOption(option =>
          option.setName('footer').setDescription('Footer del embed')
        )
        .addStringOption(option =>
          option.setName('author').setDescription('Autor del embed')
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('json')
        .setDescription('Envia un embed con un json')
        .addStringOption(option =>
          option
            .setName('data')
            .setDescription('Json del embed')
            .setRequired(true)
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Canal donde enviar el embed')
        )
        .addStringOption(option =>
          option
            .setName('asyou')
            .setDescription(
              'Envia el embed utilizando tu nombre como autor (*No)'
            )
            .setChoices(
              { name: 'Si', value: 'true' },
              { name: 'No', value: 'false' }
            )
        )
        .addStringOption(option =>
          option
            .setName('edit')
            .setDescription('Link o id del embed que quieras editar')
            .setMinLength(16)
        )
    ),
  async run(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const channel = (interaction.options.get('channel')?.channel ??
      interaction.channel) as TextBasedChannel;
    const editId = interaction.options.get('edit')?.value as string | undefined;
    const json = interaction.options.get('data')?.value as string | undefined;
    const asyou = interaction.options.get('asyou')?.value === 'true';
    const username = interaction.user.username;
    const avatarURL =
      interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL;

    const title = (interaction.options.get('title')?.value as string) || null;
    const description =
      (interaction.options.get('description')?.value as string) || null;
    const color =
      (interaction.options.get('color')?.value as ColorResolvable) || null;
    const imageUrl =
      (interaction.options.get('imageurl')?.value as string) || null;
    const footer = (interaction.options.get('footer')?.value as string) || null;
    const author = (interaction.options.get('author')?.value as string) || null;

    let webhook = null;

    if (asyou && !(channel.type === ChannelType.DM || channel.isThread())) {
      webhook =
        (await channel.fetchWebhooks()).find(w => w.token) ??
        (await channel.createWebhook({
          name: 'EmbedSender',
          reason: 'Embed command execution',
        }));
    }

    switch (subcommand) {
      case 'send':
        {
          let embed = null;

          try {
            embed = new EmbedBuilder()
              .setTitle(title)
              .setDescription(description)
              .setColor(color)
              .setImage(imageUrl);

            if (author) embed.setAuthor({ name: author });
            if (footer) embed.setFooter({ text: footer });
          } catch (error) {
            await interaction.reply({
              content: `Hubo un error creando el embed:\n\`\`\`\n${error}\`\`\``,
              ephemeral: true,
            });
            return;
          }

          if (editId) {
            const message = await (webhook instanceof Webhook
              ? webhook.fetchMessage(editId)
              : interaction.channel?.messages.fetch(editId));

            if (!message) {
              void interaction.reply({
                content: 'No se encontro el mensaje',
                ephemeral: true,
              });
              return;
            }

            await message.edit({
              embeds: [embed],
            });
            return;
          }

          if (webhook instanceof Webhook) {
            await webhook.send({
              embeds: [embed],
              username,
              avatarURL,
            });
          } else {
            await channel.send({
              embeds: [embed],
            });
          }

          await interaction.reply({
            content: 'Embed enviado',
            ephemeral: true,
          });
        }
        break;

      case 'json':
        {
          let embed = null;

          try {
            if (!json) throw new Error('Hubo un error al cargar el json');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            embed = new EmbedBuilder(JSON.parse(json));
          } catch (error) {
            if (error instanceof Error && error.name === 'SyntaxError') {
              await interaction.reply({
                content: `Hubo un error parseando el json:\n\`\`\`\n${error.message}\`\`\``,
                ephemeral: true,
              });
              return;
            }

            await interaction.reply({
              content: `Hubo un error creando el embed:\n\`\`\`\n${error}\`\`\``,
              ephemeral: true,
            });
            return;
          }

          if (editId) {
            const message = await (webhook instanceof Webhook
              ? webhook.fetchMessage(editId)
              : interaction.channel?.messages.fetch(editId));

            if (!message) {
              await interaction.reply({
                content: 'No se encontro el mensaje',
                ephemeral: true,
              });
              return;
            }

            await message.edit({
              embeds: [embed],
            });
            return;
          }

          if (webhook instanceof Webhook) {
            await webhook.send({
              embeds: [embed],
              username,
              avatarURL,
            });
          } else {
            await channel.send({
              embeds: [embed],
            });
          }

          await interaction.reply({
            content: 'Embed enviado',
            ephemeral: true,
          });
        }
        break;
    }
  },
} satisfies IMySlashCommand;
