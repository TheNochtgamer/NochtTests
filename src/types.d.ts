import type Discord, {
  ClientEvents,
  EmbedData,
  ColorResolvable,
} from 'discord.js';
import type _Bot from './lib/structures/Bot';
import type _GuildData from './lib/structures/GuildData';
import type _UserData from './lib/structures/UserData';

declare type Bot = _Bot;
declare type GuildData = _GuildData;
declare type UserData = _UserData;

declare type MyEmbedData = Omit<EmbedData, 'color'> & {
  color: ColorResolvable | number;
};

declare interface RateLimit {
  lastTick: Date;
  uses: number;
}

/**
 * La interfaz de los eventos del bot para agregar argumentos custom cada de ser necesario
 */
declare interface MyClientEvents extends ClientEvents {
  ready: [client: Bot];
  interactionCreate: [ClientEvents['interactionCreate'][0] & { client: Bot }];
  messageCreate: [ClientEvents['messageCreate'][0] & { client: Bot }];
}

declare interface MyBotEvent<E extends keyof ClientEvents> {
  name: E;

  /**
   * Si el evento solo debe ser ejecutado una vez
   */
  once?: boolean;

  /**
   * La funcion principal del evento
   */
  run: (...args: MyClientEvents[E]) => void | Promise<void>;
}

declare interface MySlashCommand {
  /**
   * Lista de ids de roles requeridos para utilizar el comando
   */
  roles_req?: string[];

  /**
   * Lista de permisos requeridos para utilizar el comando
   */
  perms_req?: Discord.PermissionResolvable[];

  /**
   * Si es requerido que el usuario tenga todos los roles para utilizar el comando
   */
  allRoles_req?: boolean;

  /**
   * Si es requerido que el usuario tenga todos los permisos para utilizar el comando
   */
  allPerms_req?: boolean;

  /**
   * Si es requerido que el usuario tenga los roles y los permisos requeridos para utilizar el comando
   */
  everthing_req?: boolean;

  /**
   * Convierte el comando unicamente disponible para los owners declarados en el .env
   */
  onlyOwners?: boolean;

  /**
   * Tiempo en ms de enfriamiento del comando por persona
   */
  rateLimit?: { cooldown: number; maxUses?: number };

  /**
   * Si el comando debe ser diferido si se ejecuta despues de cierto tiempo
   */
  deferIfToLate?: { defer: boolean; ephemeral: boolean };

  /**
   * Los datos del comando a cargar a discord
   */
  data:
    | Discord.SlashCommandBuilder
    | Omit<
        Discord.SlashCommandBuilder,
        | 'addBooleanOption'
        | 'addUserOption'
        | 'addChannelOption'
        | 'addRoleOption'
        | 'addAttachmentOption'
        | 'addMentionableOption'
        | 'addStringOption'
        | 'addIntegerOption'
        | 'addNumberOption'
      >;

  /**
   * La function que se ejecuta al necesitar auto completar una opcion del comando
   */
  autoComplete?: (
    interaction: Discord.AutocompleteInteraction & { client: Bot }
  ) =>
    | Array<Discord.ApplicationCommandOptionChoiceData<string | number>>
    | Promise<
        Array<Discord.ApplicationCommandOptionChoiceData<string | number>>
      >;

  /**
   * La funcion principal del comando
   */
  run: (
    interaction: Discord.ChatInputCommandInteraction & { client: Bot }
  ) => void | Promise<void>;
}

declare interface MySlashSubCommand {
  /**
   * Los datos del comando a cargar a discord
   */
  data: Discord.SlashCommandSubcommandBuilder;

  /**
   * La function que se ejecuta al necesitar auto completar una opcion del comando
   */
  autoComplete?: (
    interaction: Discord.AutocompleteInteraction & { client: Bot }
  ) =>
    | Array<Discord.ApplicationCommandOptionChoiceData<string | number>>
    | Promise<
        Array<Discord.ApplicationCommandOptionChoiceData<string | number>>
      >;

  /**
   * La funcion principal del comando
   */
  run: (
    interaction: Discord.ChatInputCommandInteraction & { client: Bot }
  ) => void | Promise<void>;
}

declare interface DisabledCommand {
  /**
   * El nombre del comando
   */
  name: string;

  /**
   * La razon por la cual el comando esta desactivado
   */
  reason?: string;
}
