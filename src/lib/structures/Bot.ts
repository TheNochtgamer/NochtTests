import type { MyBotEvent, MySlashCommand } from '../../types';
// import type { ClientOptions } from 'discord.js';
import utils from '../Utils';
import { Client, Collection } from 'discord.js';
import BotSettings from './BotSettings';

export default class Bot extends Client {
  public commands = new Collection<string, MySlashCommand>();
  public settings = new BotSettings();

  // constructor(options: ClientOptions) {
  //   super(options);
  // }

  async loadCommands(reload = false): Promise<void> {
    const pref = '(loadCommands())';

    console.log(pref, 'Purgando comandos...');
    if (reload) await utils.refreshCachedFiles('commands');
    console.log(pref, 'Cargando comandos...');
    const FILES = await utils.obtainMyFiles('commands');
    this.commands.clear();

    let success = 0;
    for (const commandFile of FILES) {
      try {
        const { default: command }: { default: MySlashCommand } = await import(
          commandFile
        );
        this.commands.set(command.data.name, command);
        success++;
      } catch (error) {
        console.log(pref, `Error al cargar el comando "${commandFile}"`, error);
      }
    }

    console.log(pref, `${success}/${FILES.length} comandos cargados`);
  }

  async loadEvents(reload = false): Promise<void> {
    const pref = '(loadEvents())';

    console.log(pref, 'Purgando eventos...');
    if (reload) await utils.refreshCachedFiles('events');
    console.log(pref, 'Cargando eventos...');
    const FILES = await utils.obtainMyFiles('events');
    this.removeAllListeners();

    let success = 0;
    for (const eventFile of FILES) {
      try {
        const { default: event }: { default: MyBotEvent<any> } = await import(
          eventFile
        );
        if (event.name === 'ready' || event.once) {
          this.once(event.name, event.run);
        } else {
          this.on(event.name, event.run);
        }
        success++;
      } catch (error) {
        console.log(pref, `Error al cargar el evento "${eventFile}"`, error);
      }
    }

    console.log(pref, `${success}/${FILES.length} eventos cargados`);
  }

  async init(token: string): Promise<void> {
    const pref = '(init())';

    if (this.user?.id) return;
    await Promise.all([this.loadEvents(), this.loadCommands()]);

    console.log(pref, 'Login in...');
    await this.login(token);
  }
}
