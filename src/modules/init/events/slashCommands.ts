import type { IMyBotEvent } from '../../../types';
import { Embeds } from '../../../lib/Enums';
import utils from '../../../lib/Utils';
import UsersManager from '../../../services/UsersManager';
import GuildsManager from '../../../services/GuildsManager';
import SystemLog from '../../../lib/structures/SystemLog';

const logger = new SystemLog('modules', 'init', 'events', 'slashCommands');

// EVENTO PARA CUANDO SE EJECUTA UN COMANDO
export default {
  name: 'interactionCreate',

  async run(interaction) {
    if (!interaction.isChatInputCommand()) return;
    const client = interaction.client;
    const command = client.commands.get(interaction.commandName);

    // --UserData--
    const userData = UsersManager.getUserData(interaction.user.id);
    const guildData = interaction.guildId
      ? GuildsManager.getGuildData(interaction.guildId)
      : undefined;
    // --/UserData--

    if (!command) {
      logger.warn(
        'run',
        `No se encontro el comando ${interaction.commandName}`
      );
      if (interaction.replied) return;
      interaction
        .reply({
          content:
            'Hubo un error interno al intentar encontrar el comando\nPorfavor intenta mas tarde...',
          ephemeral: true,
        })
        .catch(logger.error.bind(logger, 'run', 'Error al responder'));

      return;
    }

    // --DisableCheck--
    const disabledCommand = utils.getDisabledCommand(
      command.definition.data.name,
      userData,
      guildData
    );

    if (disabledCommand && !utils.checkBotDev(interaction.user.id)) {
      logger.warn(
        `El comando "${interaction.commandName}" esta deshabilitado para el usuario ${interaction.user.username}`
      );
      void utils.embedReply(
        interaction,
        Embeds.commandDisabled(
          interaction.user.username,
          disabledCommand.disabled.reason
        )
      );

      return;
    }
    // --DisableCheck--

    // --NCheckAuth--
    if (!(await utils.authorizationCheck(interaction, command))) {
      logger.warn(
        'run',
        `El usuario ${interaction.user.username} intento acceder al comando ${interaction.commandName} sin autorizacion`
      );
      void utils.embedReply(
        interaction,
        Embeds.notAuthorised(interaction.user.username)
      );

      return;
    }
    // --NCheckAuth--

    // --RateLimiter--
    const identifier = `${interaction.commandName}-${interaction.user.id}`;

    if (
      utils.rateLimitCheck(
        identifier,
        command.rateLimit?.cooldown,
        command.rateLimit?.maxUses
      ) &&
      !utils.checkBotDev(interaction.user.id)
    ) {
      const now = new Date();
      const rateLimit = utils.getRateLimit(identifier);
      const timestamp = rateLimit
        ? Math.round(
            (rateLimit.lastTick.getTime() +
              (now.getTime() - rateLimit.lastTick.getTime())) /
              1000
          )
        : undefined;

      logger.warn(
        'run',
        `El usuario ${interaction.user.username} supero el limite del comando ${interaction.commandName}`
      );
      void utils.embedReply(
        interaction,
        Embeds.rateLimit(interaction.user.username, timestamp)
      );

      return;
    }
    // --RateLimiter--

    logger.log(
      'run',
      `${interaction.user.username} ejecuto el comando "${interaction.commandName}"`
    );
    // TODO crear un comando el cual sirva para eliminar mensajes del bot con el id, y para eso revise los permisos del miembro sobre el canal

    if (command.deferIfToLate?.defer)
      setTimeout(async () => {
        try {
          if (interaction.deferred || interaction.replied) return;
          await interaction.deferReply({
            ephemeral: command.deferIfToLate?.ephemeral ?? true,
          });
        } catch (error) {}
      }, 2 * 1300);

    try {
      await command.run(interaction);
    } catch (error) {
      logger.error(
        'run',
        `Hubo un error ejecutando el comando ${interaction.commandName}:`,
        error
      );
      try {
        const content = `Hubo un error interno al ejecutar el comando ${
          interaction.commandName
        }.
        > </${command.definition.data.name}${
          command.definition.data.options.some((opt: any) => opt.type === 1)
            ? ` ${command.definition.data.options
                .filter((opt: any) => opt.type === 1)
                .map((sub: any) => `${sub.name}`)
                .join(' ')}`
            : ''
        }:${interaction.command?.id}>`;

        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({
            content,
          });
        } else {
          await interaction.reply({
            content,
            ephemeral: true,
          });
        }
      } catch (error) {}
    }
  },
} satisfies IMyBotEvent<'interactionCreate'>;
