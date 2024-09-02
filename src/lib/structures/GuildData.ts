import type { IDisabledCommand } from '../../types';

type data = string | (Partial<GuildData> & { id: string });

export default class GuildData {
  // data
  public readonly id: string;
  public prefix: string = '>';
  public disabledCommands: IDisabledCommand[] = [];

  // experimental

  constructor(data: data) {
    if (typeof data === 'string') {
      this.id = data;
      return;
    }

    this.id = data.id;
    if (data.prefix) this.prefix = data.prefix;
    if (data.disabledCommands) this.disabledCommands = data.disabledCommands;
  }
}
