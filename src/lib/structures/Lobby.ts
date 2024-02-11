import utils from '../Utils';

export default class Lobby {
  public usersIds: string[] = [];
  public game: string;
  public id: string;

  constructor(game: string, id: string) {
    this.game = game;
    this.id = id;
  }

  public addUser(userId: string): void {
    if (!utils.validateId(userId)) throw new Error('Invalid id');
    this.usersIds.push(userId);
  }
}
