import type { IDisabledCommand } from '../types';
import cacheMe from './cacheMe';
import { CachePointers } from '../lib/Enums';
import UserData from '../lib/structures/UserData';
import utils from '../lib/Utils';
import DatabaseManager from './DatabaseManager';

export default class UsersManager {
  private static createBlankUserData(id: string): UserData {
    const userData = new UserData(id);
    cacheMe.set(id + CachePointers.user, userData);
    return userData;
  }

  private static async fetchUserData(id: string): Promise<UserData | null> {
    const data = await DatabaseManager.UserDataModel.findOne({
      where: { ds_id: id },
    });

    if (!data) return null;
    const rawData = data.get({ plain: true });

    const parsedData = new UserData({
      id: rawData.ds_id,
      blocked: rawData.blocked,
      blockedReason: rawData.blocked_reason,
      echoActivated: rawData.echo_activated,
    });

    cacheMe.set(id + CachePointers.user, parsedData);
    return parsedData;
  }

  public static async updateUserData(
    id: string,
    data: UserData
  ): Promise<void> {
    if (!utils.validateId(id)) throw new Error('Invalid id');

    cacheMe.set(id + CachePointers.user, data);

    await DatabaseManager.UserDataModel.upsert({
      ds_id: id,
      blocked: data.blocked,
      blocked_reason: data.blockedReason,
      echo_activated: data.echoActivated,
    });
  }

  public static async getUserData(id: string): Promise<UserData> {
    if (!utils.validateId(id)) throw new Error('Invalid id');

    const userData =
      (cacheMe.get(id + CachePointers.user) as UserData) ||
      (await this.fetchUserData(id)) ||
      this.createBlankUserData(id);

    userData.disabledCommands = (
      await DatabaseManager.DisabledCommandsModel.findAll({
        where: { ds_id: id, type: 'user' },
      })
    ).map(dc => {
      const raw = dc.get({ plain: true });
      return {
        name: raw.name,
        reason: raw.reason,
        type: raw.type,
      } satisfies IDisabledCommand;
    });

    return userData;
  }
}
