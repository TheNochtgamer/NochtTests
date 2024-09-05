import type Discord, {
  ClientEvents,
  EmbedData,
  ColorResolvable,
} from 'discord.js';
import type _Bot from './lib/structures/Bot';
import type _GuildData from './lib/structures/GuildData';
import type _UserData from './lib/structures/UserData';
import type _AgsUserData from './lib/structures/AGS/AgsUserData';

declare type Bot = _Bot;
declare type GuildData = _GuildData;
declare type UserData = _UserData;
declare type AgsUserData = _AgsUserData;

declare type MyEmbedData = Omit<EmbedData, 'color'> & {
  color: ColorResolvable | number;
};

declare type MyChatInteraction = Discord.ChatInputCommandInteraction & {
  client: Bot;
};

declare interface IRateLimit {
  lastTick: Date;
  uses: number;
}

/**
 * La interfaz de los eventos del bot para agregar argumentos custom cada de ser necesario
 */
declare interface IMyClientEvents extends ClientEvents {
  ready: [client: Bot];
  interactionCreate: [ClientEvents['interactionCreate'][0] & { client: Bot }];
  messageCreate: [ClientEvents['messageCreate'][0] & { client: Bot }];
}

declare interface IMyBotEvent<E extends keyof ClientEvents> {
  /**
   * En caso de necesitar desactivar la carga del evento
   */
  _ignore?: boolean;

  name: E;

  /**
   * Si el evento solo debe ser ejecutado una vez
   */
  once?: boolean;

  /**
   * La funcion principal del evento
   */
  run: (...args: IMyClientEvents[E]) => void | Promise<void>;
}

declare interface IMyCommandDataOnlyOptions {
  kind: 'OptionsOnly';
  data: Discord.SlashCommandOptionsOnlyBuilder;
}

declare interface IMyCommandDataSubcommandsOnly {
  kind: 'SubsOnly';
  data: Discord.SlashCommandSubcommandsOnlyBuilder;
}

declare interface IMyCommandDataImSubCommand {
  kind: 'ImSubCommand';
  data: Discord.SlashCommandSubcommandBuilder;
}

declare type MyCommandDataTypes = [
  IMyCommandDataOnlyOptions,
  IMyCommandDataSubcommandsOnly,
  IMyCommandDataImSubCommand
];

declare interface IMySlashCommand<T = MyCommandDataTypes[T]> {
  /**
   * En caso de necesitar desactivar la carga del comando
   */
  _ignore?: boolean;

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
  definition: T;

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
  run: (interaction: MyChatInteraction) => void | Promise<void>;
}

declare interface IUserDisabledCommand {
  cmd_name: string;
  ds_id: string;
  reason?: string;
  type: 'user';
}

declare interface IGuildDisabledCommand {
  cmd_name: string;
  ds_id: string;
  reason?: string;
  type: 'guild';
}

declare interface IGlobalDisabledCommand {
  cmd_name: string;
  reason?: string;
  type: 'global';
}

export interface IAgsRewardPageResponse {
  text: string;
  code: number;
  extra: string | null;
  extra2: string | null;
  moreimg?: string;
  more?: number;
  morename?: string;
}
