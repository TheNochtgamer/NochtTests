import type { IDisabledCommand } from '../../types';

type data = string | (Partial<UserData> & { ds_id: string });

export default class UserData {
  // data
  public readonly ds_id: string;
  public blocked: boolean = false;
  public blockedReason: string | null = null;
  public disabledCommands: IDisabledCommand[] = [];

  // experimental
  public echoActivated: boolean = false;

  constructor(data: data) {
    if (typeof data === 'string') {
      this.ds_id = data;
      return;
    }

    this.ds_id = data.ds_id;
    if (data.blocked) this.blocked = data.blocked;
    if (data.blockedReason) this.blockedReason = data.blockedReason;
    if (data.disabledCommands) this.disabledCommands = data.disabledCommands;
    if (data.echoActivated) this.echoActivated = data.echoActivated;
  }
}
