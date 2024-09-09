import type {
  IMySlashCommand,
  IRateLimit,
  MyEmbedData,
  UserData,
  GuildData,
  Bot,
  IUserDisabledCommand,
  IGuildDisabledCommand,
  IGlobalDisabledCommand,
} from '@/types';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMemberRoleManager,
  PermissionsBitField,
} from 'discord.js';
import type {
  ButtonInteraction,
  ApplicationCommand,
  ModalSubmitInteraction,
  Collection,
  ChatInputCommandInteraction,
  CommandInteraction,
  Message,
  InteractionResponse,
} from 'discord.js';
import path from 'path';
import fs from 'fs';
import { CachePointers, CacheTts } from './Enums';
import { bot } from '@/index';
import cacheMe from '@/services/cacheMe';
import { setTimeout } from 'node:timers/promises';
import SystemLog from './structures/SystemLog';

const logger = new SystemLog('lib', 'Utils');

class Utils {
  public sleep = setTimeout;

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
  public validateId(id: string = ''): boolean {
    return !!id && !isNaN(parseInt(id)) && id?.length >= 17 && id?.length <= 20;
  }

  /**
   * Revisa que un id pertenezca a un bot developer
   */
  public checkBotDev(id: string = ''): boolean {
    return process.env.BOT_OWNERS?.includes(id) ?? false;
  }

  private obtainModules(): string[] {
    const PATH = path.join(__dirname, '../', 'modules');
    const modules = [
      path.join(PATH, 'init'),
      fs
        .readdirSync(PATH, {
          withFileTypes: true,
        })
        .filter(f => f.isDirectory() && f.name !== 'init')
        .map(f => path.join(PATH, f.name)),
    ].flat();

    return modules;
  }

  public async obtainMyFiles(
    searchDirName = '',
    complete = false
  ): Promise<string[]> {
    // __dirname + '../' = /src
    if (!searchDirName) return [];

    const modules = this.obtainModules();

    // Itera todas las carpetas de modulos y busca los archivos dentro de searchDirName, obtiene los archivos y los filtra, permitiendo la existencia de un 'comando' en archivo o carpeta. Pero de todas formas mapea todo en archivos consecutivos
    const totalFiles = modules.flatMap(moduleDir => {
      const PATH = path.join(moduleDir, searchDirName);

      if (!fs.existsSync(PATH)) return [];

      const files = fs
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

      return files;
    });

    return totalFiles;
  }

  public async refreshCachedFiles(dirName = ''): Promise<void> {
    const FILES = await this.obtainMyFiles(dirName, true);

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    FILES.forEach(f => delete require.cache[require.resolve(f)]);
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
    if (!client.commands.size) return;
    let cmds = null;

    try {
      const cmdDatas = client.commands
        .map(cmd =>
          cmd.definition.kind !== 'ImSubCommand' ? cmd.definition.data : []
        )
        .flat();

      if (guildId && this.validateId(guildId)) {
        const GUILD = await client.guilds.fetch(guildId);
        if (!GUILD) throw new Error(`No se encontro el guild`);
        cmds = await GUILD.commands.set(cmdDatas);
      } else {
        cmds = await client.application?.commands?.set(cmdDatas);
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
      logger.error(
        'summitCommands',
        'Error al intentar subir los comandos:',
        error
      );
      return;
    }
    logger.log('summitCommands', `${cmds.size} comandos subidos`);
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
    const _debug = false;

    const clientCmds = client.commands.map(cmd => cmd.definition.data);
    let serverCmds: Collection<string, ApplicationCommand> | null | undefined;
    if (!clientCmds.length) return 2;

    try {
      serverCmds =
        guildId && this.validateId(guildId)
          ? await client.guilds.cache.get(guildId)?.commands?.fetch()
          : await client.application?.commands?.fetch();
      if (!serverCmds) throw new Error('No se encontraron los comandos');
    } catch (error) {
      logger.error(
        'checkSyncedCommands',
        'Error al intentar obtener los comandos'
      );
      return 2;
    }

    // if (serverCmds.size !== clientCmds.length) return 0;

    /**
     * For debugging
     *
     * clientCmds.map(c => {return {n:c.name, o:c.options.map(o => o.name)}})
     * serverCmds.map(c => {return {n:c.name, o:c.options.map(o => o.name)}})
     *
     */

    // TODO Crear un type personalizado para evitar el uso de @ts-expect-error
    if (
      !clientCmds.every(cCmd =>
        serverCmds?.some(
          sCmd =>
            cCmd.name === sCmd.name &&
            cCmd.options?.every(
              (
                cCmdOption: any
              ) /* Sacar una vez agreguen la compatibilidad con user commands */ =>
                sCmd.options.some(sCmdOption => {
                  const res =
                    // Discord js no lo definio correctamente, pero existe y funciona
                    sCmdOption.name === cCmdOption.name &&
                    (cCmdOption.options instanceof Array &&
                    // @ts-expect-error Discord js no lo definio correctamente, pero existe y funciona
                    sCmdOption.options instanceof Array
                      ? cCmdOption.options.length ===
                          // @ts-expect-error Discord js no lo definio correctamente, pero existe y funciona
                          sCmdOption.options.length &&
                        (cCmdOption.options as any[]).every(cCmdSubOption =>
                          // @ts-expect-error Discord js no lo definio correctamente, pero existe y funciona
                          sCmdOption.options.some(
                            // @ts-expect-error Discord js no lo definio correctamente, pero existe y funciona
                            sCmdSubOption =>
                              sCmdSubOption.name === cCmdSubOption.name
                          )
                        )
                      : true);

                  if (_debug)
                    logger.log(
                      'checkSyncedCommands',
                      `${cCmdOption.name} === ${sCmdOption.name} : ${res}`,
                      (cCmdOption.name === sCmdOption.name) === res
                        ? '✅'
                        : '❌'
                    );

                  return res;
                })
            )
        )
      ) ||
      !serverCmds.every(sCmd =>
        clientCmds.some(
          cCmd =>
            cCmd.name === sCmd.name &&
            sCmd.options.every(sCmdOption =>
              cCmd.options?.some((cCmdOption: any) => {
                const res =
                  sCmdOption.name === cCmdOption.name &&
                  (cCmdOption.options instanceof Array &&
                  // @ts-expect-error Discord js no lo definio correctamente, pero existe y funciona
                  sCmdOption.options instanceof Array
                    ? // @ts-expect-error Discord js no lo definio correctamente, pero existe y funciona
                      cCmdOption.options.length === sCmdOption.options.length &&
                      (cCmdOption.options as any[]).every(cCmdSubOption =>
                        // @ts-expect-error Discord js no lo definio correctamente, pero existe y funciona
                        sCmdOption.options.some(
                          // @ts-expect-error Discord js no lo definio correctamente, pero existe y funciona
                          sCmdSubOption =>
                            sCmdSubOption.name === cCmdSubOption.name
                        )
                      )
                    : true);

                if (_debug)
                  logger.log(
                    'checkSyncedCommands',
                    `${sCmdOption.name} === ${cCmdOption.name} : ${res}`,
                    (sCmdOption.name === cCmdOption.name) === res ? '✅' : '❌'
                  );

                return res;
              })
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
      logger.error('embedReply', 'Error al responder una interaccion', error);
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
        | IRateLimit
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
      } satisfies IRateLimit,
      { ttl: cooldown }
    );
    return false;
  }

  getRateLimit(identifier: string): IRateLimit | undefined {
    return cacheMe.get(identifier + CachePointers.rateLimit) as
      | IRateLimit
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
    command: IMySlashCommand
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
  ):
    | null
    | IUserDisabledCommand
    | IGuildDisabledCommand
    | IGlobalDisabledCommand {
    const globalDisabledCommand = bot.settings.disabled_commands.find(
      cmd => cmd.cmd_name === commandName
    );
    if (globalDisabledCommand) return globalDisabledCommand;

    if (userData) {
      const disabledCommand = userData.disabled_commands.find(
        cmd => cmd.cmd_name === commandName
      );
      if (disabledCommand) return disabledCommand;
    }

    if (guildData) {
      const disabledCommand = guildData.disabled_commands.find(
        cmd => cmd.cmd_name === commandName
      );
      if (disabledCommand) return disabledCommand;
    }

    return null;
  }

  /**
   * Envia una simple solicitud de confirmacion
   *
   * @returns 0 si fue aceptada
   *
   * @returns 1 si fue rechazada
   *
   * @returns 2 si se acabo el tiempo de respuesta
   */
  public async confirmationForm(
    interaction:
      | CommandInteraction
      | ButtonInteraction
      | ModalSubmitInteraction
      | ChatInputCommandInteraction,
    text: string,
    timeout: number = 30 * 1000,
    savePreviousState = true
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

    if (text.trim().length === 0)
      throw new Error('El texto no puede estar vacio');

    const previousState =
      savePreviousState && interaction.isMessageComponent()
        ? {
            embeds: interaction.message.embeds,
            components: interaction.message.components,
            content: interaction.message.content || undefined,
          }
        : null;

    const reply =
      interaction.replied || interaction.deferred
        ? await interaction.editReply({
            // @ts-ignore
            components: [row],
            embeds: [],
            content: text,
          })
        : await interaction.reply({
            // @ts-ignore
            components: [row],
            embeds: [],
            content: text,
            ephemeral: true,
          });

    try {
      const response = await reply.awaitMessageComponent({ idle: timeout });

      await interaction.editReply(
        previousState ?? { components: [], embeds: [] }
      );
      if (response.customId === 'accept') return 0;
      if (response.customId === 'deny') return 1;
    } catch (error) {}

    return 2;
  }

  /**
   * Obtiene un elemento random del array enviado
   *
   * @returns devuelve un elemento al azar del array, si esta vacio, devuelve undefined
   */
  public arrayRandom<T>(array: T[]): T | undefined {
    if (array.length === 0) return;
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Utilidad para limitar la cantidad de veces que se debe ejecutar un codigo cada tantas iteraciones
   *
   * @param identifier identificador para el cache
   * @param maxExecutions limite de iteraciones para que se deba ejecutar el codigo
   * @returns devuelve true en el caso de que la ejecuciones lleguen al limite establecido o sea la primer iteracion
   */
  public everyXExecutions(identifier: string, maxExecutions: number): boolean {
    const existingExecutions = cacheMe.get(
      identifier + CachePointers.executionsCacher
    ) as number | undefined;

    const count = existingExecutions ?? 0;

    cacheMe.set(identifier + CachePointers.executionsCacher, count + 1, {
      ttl: CacheTts.executionsCacher,
    });

    if (existingExecutions === undefined) return true;

    if (count >= maxExecutions) {
      cacheMe.set(identifier + CachePointers.executionsCacher, 0, {
        ttl: CacheTts.executionsCacher,
      });
      return true;
    }

    return false;
  }

  public async getRandomSleep<T = undefined>(
    min = 1000,
    max?: number,
    toReturn?: T
  ): Promise<T | undefined> {
    if (max === undefined) max = min;
    const sleepTime = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.sleep(sleepTime);
    return toReturn;
  }

  public compareTwoStrings(a: string, b: string): number {
    const similarity = this.similarity(a, b);
    const percentage = similarity * 100;
    return percentage;
  }

  private similarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    const longerLength = longer.length;

    if (longerLength === 0) {
      return 1.0;
    }

    return (longerLength - this.editDistance(longer, shorter)) / longerLength;
  }

  private editDistance(a: string, b: string): number {
    a = a.toLowerCase();
    b = b.toLowerCase();

    const costs = new Array<number>(b.length + 1);
    for (let i = 0; i <= a.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= b.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (a.charAt(i - 1) !== b.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) {
        costs[b.length] = lastValue;
      }
    }
    return costs[b.length];
  }
}

export default new Utils();
