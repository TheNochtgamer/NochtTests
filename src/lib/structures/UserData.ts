import type { IDisabledCommand } from '../../types';

export default class UserData {
  // data
  public readonly id: string;
  public blocked: boolean = false;
  public blockedReason: string | null = null;
  public disabledCommands: IDisabledCommand[] = [];

  // experimental
  public echo: boolean = false;

  constructor(id: string) {
    this.id = id;
  }
}
