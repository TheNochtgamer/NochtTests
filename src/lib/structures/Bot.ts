import type { IMyBotEvent, IMySlashCommand } from '../../types';
// import type { ClientOptions } from 'discord.js';
import utils from '../Utils';
import { Client, Collection } from 'discord.js';
import BotSettings from './BotSettings';

export default class Bot extends Client {
  public commands = new Collection<string, IMySlashCommand>();
  public settings = new BotSettings();

  // constructor(options: ClientOptions) {
  //   super(options);
  // }

  async loadCommands(reload = false): Promise<void> {
    const _pref = '(loadCommands())';

    if (reload) {
      console.log(_pref, 'Purgando comandos...');
      await utils.refreshCachedFiles('commands');
    }
    console.log(_pref, 'Cargando comandos...');
    const FILES = await utils.obtainMyFiles('commands');
    this.commands.clear();

    let success = 0;
    for (const commandFile of FILES) {
      try {
        const { default: command }: { default: IMySlashCommand } = await import(
          commandFile
        );
        this.commands.set(command.data.name, command);
        success++;
      } catch (error) {
        console.log(
          _pref,
          `Error al cargar el comando "${commandFile}"`,
          error
        );
      }
    }

    console.log(_pref, `${success}/${FILES.length} comandos cargados`);
  }

  async loadEvents(reload = false): Promise<void> {
    const _pref = '(loadEvents())';

    if (reload) {
      console.log(_pref, 'Purgando eventos...');
      await utils.refreshCachedFiles('events');
    }
    console.log(_pref, 'Cargando eventos...');
    const FILES = await utils.obtainMyFiles('events');
    this.removeAllListeners();

    let success = 0;
    for (const eventFile of FILES) {
      try {
        const { default: event }: { default: IMyBotEvent<any> } = await import(
          eventFile
        );
        if (event.name === 'ready' || event.once) {
          this.once(event.name, event.run);
        } else {
          this.on(event.name, event.run);
        }
        success++;
      } catch (error) {
        console.log(_pref, `Error al cargar el evento "${eventFile}"`, error);
      }
    }

    console.log(_pref, `${success}/${FILES.length} eventos cargados`);
  }

  async init(token: string): Promise<void> {
    const _pref = '(init())';

    if (this.user?.id) return;
    await Promise.all([this.loadEvents(), this.loadCommands()]);

    console.log(_pref, 'Login in...');
    await this.login(token);
  }
}
