import type { IDisabledCommand } from '../../types';

export default class GuildData {
  // data
  public readonly id: string;
  public prefix: string = '>';
  public disabledCommands: IDisabledCommand[] = [];

  // experimental

  constructor(id: string) {
    this.id = id;
  }
}
