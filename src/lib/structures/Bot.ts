import type { IMyBotEvent, IMySlashCommand } from '../../types';
// import type { ClientOptions } from 'discord.js';
import utils from '../Utils';
import { Client, Collection } from 'discord.js';
import BotSettings from './BotSettings';
import SystemLog from './SystemLog';

const logger = new SystemLog('lib', 'structures', 'Bot');

export default class Bot extends Client {
  public commands = new Collection<string, IMySlashCommand>();
  public settings = new BotSettings();

  // constructor(options: ClientOptions) {
  //   super(options);
  // }

  async loadCommands(reload = false): Promise<void> {
    let total = 0;
    let success = 0;

    if (reload) {
      logger.log('loadCommands', 'Purgando comandos...');
      await utils.refreshCachedFiles('commands');
    }
    logger.log('loadCommands', 'Cargando comandos...');
    const FILES = await utils.obtainMyFiles('commands');
    this.commands.clear();

    total = FILES.length;
    for (const commandFile of FILES) {
      try {
        const { default: command }: { default: IMySlashCommand } = await import(
          commandFile
        );

        if (!!command._ignore || command.definition.kind === 'ImSubCommand') {
          total--;
          continue;
        }

        this.commands.set(command.definition.data.name, command);
        success++;
      } catch (error) {
        logger.error(
          'loadCommands',
          `Error al cargar el comando "${commandFile}"`,
          error
        );
      }
    }

    logger.log('loadCommands', `[${success}/${total}] comandos cargados`);
  }

  async loadEvents(reload = false): Promise<void> {
    let success = 0;
    let total = 0;

    if (reload) {
      logger.log('loadEvents', 'Purgando eventos...');
      await utils.refreshCachedFiles('events');
    }
    logger.log('loadEvents', 'Cargando eventos...');
    const FILES = await utils.obtainMyFiles('events');
    this.removeAllListeners();

    total = FILES.length;
    for (const eventFile of FILES) {
      try {
        const { default: event }: { default: IMyBotEvent<any> } = await import(
          eventFile
        );

        if (event._ignore) {
          total--;
          continue;
        }
        if (event.name === 'ready' || event.once) {
          this.once(event.name, event.run);
        } else {
          this.on(event.name, event.run);
        }
        success++;
      } catch (error) {
        logger.error(
          'loadEvents',
          `Error al cargar el evento "${eventFile}"`,
          error
        );
      }
    }

    logger.log('loadEvents', `[${success}/${total}] eventos cargados`);
  }

  async init(token: string): Promise<void> {
    if (this.user?.id) return;
    await Promise.all([this.loadEvents(), this.loadCommands()]);

    // console.log(['lib', 'structures', 'bot'], 'Login in...');
    logger.log('init', 'Login in...');

    await this.login(token);
  }
}
