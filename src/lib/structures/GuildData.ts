import type { DisabledCommand } from '../../types';

export default class GuildData {
  // data
  public readonly id: string;
  public prefix: string = '>';
  public disabledCommands: DisabledCommand[] = [];

  // experimental

  constructor(id: string) {
    this.id = id;
  }
}
