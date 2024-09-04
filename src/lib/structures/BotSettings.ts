import type { IGlobalDisabledCommand } from '../../types';

export default class BotSettings {
  // data
  public maintenance: boolean = false;
  public disabled_commands: IGlobalDisabledCommand[] = [];
  // experimental

  // constructor() {}
}
