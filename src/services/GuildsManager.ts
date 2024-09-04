/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import cacheMe from './cacheMe';
import { CachePointers } from '../lib/Enums';
import GuildData from '../lib/structures/GuildData';
import utils from '../lib/Utils';
import DatabaseManager from './DatabaseManager';

export default class GuildsManager {
  private static createBlankGuildData(id: string): GuildData {
    const guildData = new GuildData(id);
    void this.updateGuildData(guildData);
    return guildData;
  }

  private static getFromCache(id: string): GuildData | null {
    return cacheMe.get(id + CachePointers.guild) as GuildData;
  }

  private static async fetchGuildData(id: string): Promise<GuildData | null> {
    const data = await DatabaseManager.query<GuildData[] | null>(
      `SELECT * FROM guilds WHERE id = ?`,
      [id]
    );

    if (!data || data.length === 0) return null;

    const guildData = new GuildData(data[0]);
    return guildData;
  }

  public static async updateGuildData(data: GuildData): Promise<void> {
    if (!utils.validateId(data.id)) throw new Error('Invalid id');

    await DatabaseManager.query(`CALL upsert_guild_data(?, ?)`, [
      data.id,
      data.prefix,
    ]);

    // for (const dc of data.disabledCommands) {
    //   if (!dc.name) continue;

    //   await DatabaseManager.query(`CALL upsert_disabled_command(?, ?, ?, ?)`, [
    //     id,
    //     dc.name,
    //     dc.reason,
    //     dc.type,
    //   ]);
    // }

    // const allDisabledCommands = await DatabaseManager.query(
    //   `SELECT * FROM v_disabled_commands`
    // );

    // for (const dc of allDisabledCommands) {
    //   if (data.disabledCommands.some(d => d.name === dc.name)) continue;

    //   await DatabaseManager.query(`CALL delete_disabled_command(?, ?)`, [
    //     id,
    //     dc.name,
    //   ]);
    // }
  }

  public static async getGuildData(id: string): Promise<GuildData> {
    if (!utils.validateId(id)) throw new Error('Invalid id');

    const data =
      this.getFromCache(id) ||
      (await this.fetchGuildData(id)) ||
      this.createBlankGuildData(id);

    cacheMe.set(id + CachePointers.guild, data);
    return data;
  }
}
