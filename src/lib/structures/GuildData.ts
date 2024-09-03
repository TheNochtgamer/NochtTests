import type { IDisabledCommand } from '../../types';

type data = string | (Partial<GuildData> & { ds_id: string });

export default class GuildData {
  // data
  public readonly ds_id: string;
  public prefix: string = '>';
  public disabledCommands: IDisabledCommand[] = [];

  // experimental

  constructor(data: data) {
    if (typeof data === 'string') {
      this.ds_id = data;
      return;
    }

    this.ds_id = data.ds_id;
    if (data.prefix) this.prefix = data.prefix;
    if (data.disabledCommands) this.disabledCommands = data.disabledCommands;
  }
}
