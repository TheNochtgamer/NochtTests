import type {
  MySlashCommand,
  RateLimit,
  MyEmbedData,
  UserData,
  GuildData,
  DisabledCommand,
  Bot,
} from '../types';
import path from 'path';
import fs from 'fs';
import {
  ActionRowBuilder,
  type ApplicationCommand,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type Collection,
  type CommandInteraction,
  EmbedBuilder,
  GuildMemberRoleManager,
  type ModalSubmitInteraction,
  PermissionsBitField,
  type Message,
  type InteractionResponse,
} from 'discord.js';
import { CachePointers } from './Enums';
import cacheMe from '../services/cacheMe';
import { bot } from '../index';

class Utils {
  constructor() {
    Object.keys(this).forEach((key: string) => {
      // @ts-expect-error Proteccion OPCIONAL del objeto ante cualquier modificacion externa, el copilador reconoce this como any
      if (this[key] instanceof Function) this[key] = this[key].bind(this);
      Object.defineProperty(this, key, {
        writable: false,
      });
    });
  }

  /**
   * Revisa que un snowflake de discord sea valido
   */
  validateId(id: string = ''): boolean {
    return !!id && !isNaN(parseInt(id)) && id?.length >= 17 && id?.length <= 20;
  }

  /**
   * Revisa que un id pertenezca a un bot developer
   */
  checkBotDev(id: string = ''): boolean {
    return process.env.BOT_OWNERS?.includes(id) ?? false;
  }

  // async loadFiles(dirName = ''): Promise<string[]> {
  //   const PATH = path.join(__dirname, '../', dirName);
  //   const FILES = fs
  //     .readdirSync(PATH)
  //     .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
  //     .map(f => path.join(PATH, f));

  //   if (!!require) FILES.forEach(f => delete require.cache[require.resolve(f)]);

  //   return FILES;
  // }

  async obtainMyFiles(dirName = '', complete = false): Promise<string[]> {
    const PATH = path.join(__dirname, '../', dirName);
    const FILES = fs
      .readdirSync(PATH, {
        withFileTypes: true,
      })
      .flatMap(item => {
        if (item.isFile()) return path.join(PATH, item.name);

        return fs
          .readdirSync(path.join(PATH, item.name), {
            withFileTypes: true,
          })
          .filter(
            f =>
              f.isFile() &&
              (complete ||
                path.parse(f.name).name.toLowerCase() ===
                  item.name.toLowerCase() ||
                path.parse(f.name).name.toLowerCase() === 'index')
          )
          .map(f => path.join(PATH, item.name, f.name));
      })
      .filter(f => f.endsWith('.js') || f.endsWith('.ts'));

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    FILES.forEach(f => delete require.cache[require.resolve(f)]);

    return FILES;
  }

  /**
   * Carga los slash commands en discord
   *
   * @param guildId en caso de ser undefined, intentara cargar los comandos globalmente
   */
  async summitCommands(
    client: Bot,
    guildId = process.env.GUILDID
  ): Promise<void> {
    const pref = '(summitCommands())';

    if (!client.commands.size) return;
    let cmds = null;

    console.log(
      pref,
      `Subiendo comandos${guildId ? ` (en el guild: ${guildId})` : ''}...`
    );
    try {
      if (guildId && this.validateId(guildId)) {
        const GUILD = await client.guilds.fetch(guildId);
        if (!GUILD) throw new Error(`No se encontro el guild`);
        cmds = await GUILD.commands.set(client.commands.map(cmd => cmd.data));
      } else {
        cmds = await client.application?.commands?.set(
          client.commands.map(cmd => cmd.data)
        );
      }

      // if (guildId) {
      //   const GUILD = await client.guilds.fetch(guildId);
      //   if (!this.checkId(guildId) || !GUILD) throw new Error('Id invalida');
      //   cmds = await GUILD.commands.set(client.commands.map(cmd => cmd.data));
      // } else {
      //   cmds = await client.application?.commands?.set(
      //     client.commands.map(cmd => cmd.data),
      //   );
      // }
      if (!cmds) throw new Error('No se subio ningun comando');
    } catch (error) {
      console.log(pref, 'Error al intentar subir los comandos', error);
      return;
    }
    console.log(pref, `${cmds.size} comandos subidos`);
  }

  /**
   * Revisa que los slash commands esten sincronizados con los de discord
   *
   * @returns 0 en caso de que no esten sincronizados
   * @returns 1 en caso de que esten sincronizados
   * @returns 2 en caso de que ocurra un error
   *
   * @param guildId en caso de ser undefined, intentara cargar los comandos globalmente
   */
  async checkSyncedCommands(
    client: Bot,
    guildId = process.env.GUILDID
  ): Promise<0 | 1 | 2> {
    const clientCmds = client.commands.map(cmd => cmd.data);
    let serverCmds: Collection<string, ApplicationCommand> | null | undefined;
    if (!clientCmds.length) return 2;

    try {
      serverCmds =
        guildId && this.validateId(guildId)
          ? await client.guilds.cache.get(guildId)?.commands?.fetch()
          : await client.application?.commands?.fetch();
      if (!serverCmds) throw new Error('No se encontraron los comandos');
    } catch (error) {
      console.log('Error al intentar buscar los comandos', error);
      return 2;
    }

    // if (serverCmds.size !== clientCmds.length) return 0;

    if (
      !clientCmds.every(cCmd =>
        serverCmds?.some(
          sCmd =>
            cCmd.name === sCmd.name &&
            cCmd.options.every(cCmdOption =>
              sCmd.options.some(
                sCmdOption =>
                  // @ts-expect-error Discord js no lo definio correctamente, pero existe y funciona
                  sCmdOption.name === cCmdOption.name &&
                  (sCmdOption.type !== 1
                    ? true
                    : sCmdOption.options?.length ===
                      // @ts-expect-error Discord js no lo definio correctamente, pero existe y funciona
                      cCmdOption.options?.length)
              )
            )
        )
      ) ||
      !serverCmds.every(sCmd =>
        clientCmds.some(
          cCmd =>
            cCmd.name === sCmd.name &&
            sCmd.options.every(sCmdOption =>
              cCmd.options.some(
                cCmdOption =>
                  // @ts-expect-error Discord js no lo definio correctamente, pero existe y funciona
                  cCmdOption.name === sCmdOption.name
              )
            )
        )
      )
    )
      return 0;

    return 1;
  }

  /**
   * Responde una interaccion con un embed sin necesidad de preocuparte de que rejecte
   */
  async embedReply(
    interaction: CommandInteraction,
    embedData: MyEmbedData | EmbedBuilder
  ): Promise<Message | InteractionResponse | null> {
    const embed =
      embedData instanceof EmbedBuilder ? embedData : new EmbedBuilder();

    if (!(embedData instanceof EmbedBuilder)) {
      if (embedData.title) {
        embed.setTitle(embedData.title);
      }

      if (embedData.description) {
        embed.setDescription(embedData.description);
      }

      if (embedData.color) {
        embed.setColor(embedData.color);
      } else {
        embed.setColor('White');
      }

      if (embedData.author) {
        embed.setAuthor(embedData.author);
      }

      if (embedData.timestamp === undefined) {
        embed.setTimestamp(new Date());
      } else {
        embed.setTimestamp(new Date(embedData.timestamp));
      }

      if (embedData.footer === undefined) {
        embed.setFooter({ text: interaction.client.user.username });
      } else {
        embed.setFooter(embedData.footer);
      }
    }

    try {
      const reply = await (interaction.replied || interaction.deferred
        ? interaction.editReply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed], ephemeral: true }));
      return reply;
    } catch (error) {
      console.log(`Error al responder una interaccion`, error);
      return null;
    }
  }

  /**
   * Revisa que exista un rateLimit en vigencia con el identificador
   *
   * @returns true si existe un rateLimit con el identificador
   * @returns false si no existe un rateLimit con el identificador y crea uno nuevo
   */
  rateLimitCheck(
    identifier: string,
    cooldown?: number,
    uses: number = 1
  ): boolean {
    if (!cooldown || cooldown < 500) return false;

    const now = new Date();
    const rateLimit =
      // this.rateLimits.get(identifier);
      cacheMe.get(identifier + CachePointers.rateLimit) as
        | RateLimit
        | undefined;

    if (
      rateLimit &&
      (now.getTime() - rateLimit.lastTick.getTime() < cooldown ||
        rateLimit.uses++ < uses)
    )
      return true;

    cacheMe.set(
      identifier,
      {
        lastTick: now,
        uses,
      } satisfies RateLimit,
      { ttl: cooldown }
    );
    return false;
  }

  getRateLimit(identifier: string): RateLimit | undefined {
    return cacheMe.get(identifier + CachePointers.rateLimit) as
      | RateLimit
      | undefined;
  }

  /**
   * Funcion para verificar que el usuario tenga los permisos de utilizar el comando
   *
   * Parametros:
   * - roles_req = String[]
   * - perms_req = String[]
   * - allRoles_req = Boolean
   * - allPerms_req = Boolean
   * - everthing_req = Boolean
   * - onlyOwners = Boolean
   */
  async authorizationCheck(
    interaction: CommandInteraction,
    command: MySlashCommand
  ): Promise<0 | 1> {
    // TODO Reworkear el sistema para que tambien tome en cuenta los permisos de discord con respecto a los slash
    if (this.checkBotDev(interaction.user.id)) return 1;
    if (command.onlyOwners) return 0;
    if (!interaction.guild) return 1;

    const member =
      interaction.member ??
      (await interaction.guild.members.fetch(interaction.user.id));

    let rolesCheck = false;
    let permsCheck = false;

    // ROLES CHECK
    if (
      command.roles_req?.length &&
      member?.roles instanceof GuildMemberRoleManager
    ) {
      rolesCheck =
        (command.allRoles_req
          ? member?.roles.cache.hasAll(...command.roles_req)
          : member?.roles.cache.hasAny(...command.roles_req)) || false;
    } else rolesCheck = true;

    // PERMS CHECK
    if (
      command.perms_req?.length &&
      member?.permissions instanceof PermissionsBitField
    ) {
      const hasPerms = member?.permissions.toArray();
      permsCheck = command.allPerms_req
        ? hasPerms.every(hasPerm =>
            command.perms_req?.some(neededPerm => neededPerm === hasPerm)
          )
        : hasPerms.some(hasPerm =>
            command.perms_req?.some(neededPerm => neededPerm === hasPerm)
          );
    } else permsCheck = true;

    if (command.everthing_req) {
      if (rolesCheck && permsCheck) return 1;
    } else {
      if (rolesCheck || permsCheck) return 1;
    }

    return 0;
  }

  /**
   * Revisa si un comando esta desactivado y devuelve el tipo de desactivacion con la razon
   */
  getDisabledCommand(
    commandName: string,
    userData?: UserData,
    guildData?: GuildData
  ): null | { type: 'user' | 'guild' | 'global'; disabled: DisabledCommand } {
    let disabledCommand = bot.settings.disabledCommands.find(
      cmd => cmd.name === commandName
    );
    if (disabledCommand) return { type: 'global', disabled: disabledCommand };

    if (userData) {
      disabledCommand = userData.disabledCommands.find(
        cmd => cmd.name === commandName
      );
      if (disabledCommand) return { type: 'user', disabled: disabledCommand };
    }

    if (guildData) {
      disabledCommand = guildData.disabledCommands.find(
        cmd => cmd.name === commandName
      );
      if (disabledCommand) return { type: 'guild', disabled: disabledCommand };
    }

    return null;
  }

  /**
   * Envia una simple solicitud de confirmacion
   *
   * devuelve 0 si fue aceptada
   *
   * devuelve 1 si fue rechazada
   *
   * devuelve 2 si se acabo el tiempo de respuesta
   */
  async confirmationForm(
    interaction:
      | CommandInteraction
      | ButtonInteraction
      | ModalSubmitInteraction
      | ChatInputCommandInteraction,
    message: string,
    timeout: number = 30 * 1000
  ): Promise<0 | 1 | 2> {
    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId('accept')
        .setStyle(ButtonStyle.Success)
        .setLabel('✅'),
      new ButtonBuilder()
        .setCustomId('deny')
        .setStyle(ButtonStyle.Danger)
        .setLabel('❌')
    );

    const reply =
      interaction.replied || interaction.deferred
        ? await interaction.editReply({
            content: message,
            components: [row],
          })
        : await interaction.reply({
            content: message,
            components: [row],
            ephemeral: true,
          });

    const response = await reply.awaitMessageComponent({ idle: timeout });

    await interaction.editReply({ components: [] });

    if (response.customId === 'accept') return 0;
    if (response.customId === 'deny') return 1;
    return 2;
  }
}

export default new Utils();
