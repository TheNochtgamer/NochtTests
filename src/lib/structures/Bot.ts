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

  async loadCommands(): Promise<void> {
    console.log('Cargando comandos...');
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
        console.log(`(/) Error al cargar el comando "${commandFile}"`, error);
      }
    }

    console.log(`(/) ${success}/${FILES.length} comandos cargados`);
  }

  async loadEvents(): Promise<void> {
    console.log('Cargando eventos...');
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
        console.log(`(E) Error al cargar el evento "${eventFile}"`, error);
      }
    }

    console.log(`(E) ${success}/${FILES.length} eventos cargados`);
  }

  async init(token: string): Promise<void> {
    if (this.user?.id) return;
    await Promise.all([this.loadEvents(), this.loadCommands()]);

    console.log('Login in...');
    await this.login(token);
  }
}
