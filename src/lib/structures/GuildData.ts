import type { IGuildDisabledCommand } from '@/types';

type data = string | (Partial<GuildData> & { id: string });

export default class GuildData {
  // data
  public readonly id: string;
  public prefix: string = '>';
  public disabled_commands: IGuildDisabledCommand[] = [];

  // experimental

  constructor(data: data) {
    if (typeof data === 'string') {
      this.id = data;
      return;
    }

    this.id = data.id;
    if (data.prefix !== undefined) this.prefix = data.prefix;
    if (data.disabled_commands !== undefined)
      this.disabled_commands = data.disabled_commands;
  }
}
