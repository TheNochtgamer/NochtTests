import cacheMe from './cacheMe';
import { CachePointers } from '../lib/Enums';
import GuildData from '../lib/structures/GuildData';
import utils from '../lib/Utils';
import DatabaseManager from './DatabaseManager';

export default class GuildsManager {
  private static createBlankGuildData(id: string): GuildData {
    const guild = new GuildData(id);
    return guild;
  }

  private static async fetchGuildData(id: string): Promise<GuildData | null> {
    const data = await DatabaseManager.GuildDataModel.findOne({
      where: { ds_id: id },
      include: [DatabaseManager.DisabledCommandsModel],
    });

    if (!data) return null;
    const rawData = data.get({ plain: true }) as any;

    const parsedData = new GuildData({
      id: rawData.ds_id,
      prefix: rawData.prefix,
      disabledCommands: rawData.Disabled_Commands,
    });

    return parsedData;
  }

  public static async updateGuildData(
    id: string,
    data: GuildData
  ): Promise<void> {
    if (!utils.validateId(id)) throw new Error('Invalid id');

    await DatabaseManager.GuildDataModel.upsert({
      ds_id: id,
      prefix: data.prefix,
    });

    data.disabledCommands.forEach(dc => {
      if (!dc.name) return;

      DatabaseManager.DisabledCommandsModel.upsert({
        ds_id: id,
        name: dc.name,
        reason: dc.reason,
        type: dc.type,
      });
    });
  }

  public static async getGuildData(id: string): Promise<GuildData> {
    if (!utils.validateId(id)) throw new Error('Invalid id');

    const data =
      (cacheMe.get(id + CachePointers.guild) as GuildData) ||
      (await this.fetchGuildData(id)) ||
      this.createBlankGuildData(id);

    cacheMe.set(id + CachePointers.guild, data);
    return data;
  }
}
