import cacheMe from './cacheMe';
import { CachePointers } from '../lib/Enums';
import GuildData from '../lib/structures/GuildData';
import utils from '../lib/Utils';

export default class GuildsManager {
  private static createGuildData(id: string): GuildData {
    const guild = new GuildData(id);
    cacheMe.set(id + CachePointers.guild, guild);
    return guild;
  }

  public static getGuildData(id: string): GuildData {
    if (!utils.validateId(id)) throw new Error('Invalid id');

    return (
      (cacheMe.get(id + CachePointers.guild) as GuildData) ||
      this.createGuildData(id)
    );
  }
}
