import { type ChatInputCommandInteraction } from 'discord.js';
import utils from '../Utils';
import SystemLog from './SystemLog';

const logger = new SystemLog('lib', 'structures', 'Lobby');

export default class Lobby {
  private readonly waitingTask: NodeJS.Timeout;

  public readonly id: string;
  public readonly complex: boolean;
  public game: string | null;
  public readonly usersInteractions = new Map<
    string,
    ChatInputCommandInteraction
  >();

  constructor(id: string, game: string | null, complex = false) {
    this.id = id;
    this.game = game;
    this.complex = complex;

    this.waitingTask = setInterval(this._waitingLoop.bind(this), 1000);
  }

  private async _waitingLoop(): Promise<void> {
    if (this.usersInteractions.size === 0) {
      clearInterval(this.waitingTask);
      return;
    }
    if (!utils.everyXExecutions(this.id, 10)) return;

    const players = Array.from(this.usersInteractions.values());

    players.forEach(player => {
      void this.sendShowMessage(player);
    });
  }

  // Un metodo para enviar a un usuario seleccionado sin utilizar el getShowMessage dentro de un editReply
  private async sendShowMessage(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const content =
      '```yaml\n \n' +
      `Lobby ${this.id} : ${this.game}\nPlayers: ${this.usersInteractions.size}\n` +
      Array.from(this.usersInteractions.values())
        .map(interaction => `- ${interaction.user.username}`)
        .join('\n') +
      '\n```';

    try {
      await interaction.editReply({ content });
    } catch (error) {
      logger.error('sendShowMessage', 'Error al enviar el mensaje', error);
      this.disconnectUser(interaction);
    }
  }

  public userIsHere(userId: string): boolean {
    return this.usersInteractions.has(userId);
  }

  public addUser(interaction: ChatInputCommandInteraction): void {
    // if (!utils.validateId(userId)) throw new Error('Invalid id');
    if (this.usersInteractions.has(interaction.id)) return;
    this.usersInteractions.set(interaction.user.id, interaction);

    void this.sendShowMessage(interaction);
  }

  public disconnectUser(interaction: ChatInputCommandInteraction): void {
    this.usersInteractions.delete(interaction.user.id);
  }

  //   public getShowMessage(): string {
  //     return
  //   }
}
