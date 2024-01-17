import type { DisabledCommand } from '../../types';

export default class UserData {
  // data
  public readonly id: string;
  public blocked: boolean = false;
  public blockedReason: string = '';
  public disabledCommands: DisabledCommand[] = [];

  // experimental
  public echo: boolean = false;

  constructor(id: string) {
    this.id = id;
  }
}
