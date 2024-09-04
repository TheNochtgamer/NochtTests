import type { IUserDisabledCommand } from '../../types';

type data = string | (Partial<UserData> & { id: string });

export default class UserData {
  // data
  public readonly id: string;
  public blocked: boolean = false;
  public blocked_reason: string | null = null;
  public disabled_commands: IUserDisabledCommand[] = [];

  // experimental
  public echo_activated: boolean = false;

  constructor(data: data) {
    if (typeof data === 'string') {
      this.id = data;
      return;
    }

    this.id = data.id;
    if (data.blocked !== undefined) this.blocked = Boolean(data.blocked);
    if (data.blocked_reason !== undefined)
      this.blocked_reason = data.blocked_reason;
    if (data.disabled_commands !== undefined)
      this.disabled_commands = data.disabled_commands;
    if (data.echo_activated !== undefined)
      this.echo_activated = Boolean(data.echo_activated);
  }
}
