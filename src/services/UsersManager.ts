import cacheMe from './cacheMe';
import { CachePointers } from '../lib/Enums';
import UserData from '../lib/structures/UserData';
import utils from '../lib/Utils';
import DatabaseManager from './DatabaseManager';

export default class UsersManager {
  private static createBlankUserData(id: string): UserData {
    const userData = new UserData(id);
    return userData;
  }

  private static async fetchUserData(id: string): Promise<UserData | null> {
    const data = await DatabaseManager.UserDataModel.findOne({
      where: { ds_id: id },
      include: [DatabaseManager.DisabledCommandsModel],
    });

    if (!data) return null;
    const rawData = data.get({ plain: true }) as any;

    const parsedData = new UserData({
      id: rawData.ds_id,
      blocked: rawData.blocked,
      blockedReason: rawData.blocked_reason,
      echoActivated: rawData.echo_activated,
      disabledCommands: rawData.Disabled_Commands,
    });

    return parsedData;
  }

  public static async updateUserData(
    id: string,
    data: UserData
  ): Promise<void> {
    if (!utils.validateId(id)) throw new Error('Invalid id');

    await DatabaseManager.UserDataModel.upsert({
      ds_id: id,
      blocked: data.blocked,
      blocked_reason: data.blockedReason,
      echo_activated: data.echoActivated,
    });

    // TODO - Utilizar https://stackoverflow.com/questions/48124949/nodejs-sequelize-bulk-upsert
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

  public static async getUserData(id: string): Promise<UserData> {
    if (!utils.validateId(id)) throw new Error('Invalid id');

    const userData =
      (cacheMe.get(id + CachePointers.user) as UserData) ||
      (await this.fetchUserData(id)) ||
      this.createBlankUserData(id);

    cacheMe.set(id + CachePointers.user, userData);
    return userData;
  }
}
