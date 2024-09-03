/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
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

  private static getFromCache(id: string): UserData | null {
    return cacheMe.get(id + CachePointers.user) as UserData;
  }

  private static async fetchUserData(id: string): Promise<UserData | null> {
    const data = await DatabaseManager.query<UserData | null>(
      `SELECT * FROM v_user_data WHERE ds_id = ?`,
      [id]
    );

    if (!data) return null;

    const userData = new UserData(data);
    return userData;
  }

  public static async updateUserData(
    id: string,
    data: UserData
  ): Promise<void> {
    if (!utils.validateId(id)) throw new Error('Invalid id');

    await DatabaseManager.query(`CALL upsert_user_data(?, ?, ?, ?)`, [
      id,
      data.blocked,
      data.blockedReason,
      data.echoActivated,
    ]);

    for (const dc of data.disabledCommands) {
      if (!dc.name) continue;

      await DatabaseManager.query(`CALL upsert_disabled_command(?, ?, ?, ?)`, [
        id,
        dc.name,
        dc.reason,
        dc.type,
      ]);
    }

    const allDisabledCommands = await DatabaseManager.query(
      `SELECT * FROM v_disabled_commands`
    );

    for (const dc of allDisabledCommands) {
      if (data.disabledCommands.some(d => d.name === dc.name)) continue;

      await DatabaseManager.query(`CALL delete_disabled_command(?, ?)`, [
        id,
        dc.name,
      ]);
    }
  }

  public static async getUserData(id: string): Promise<UserData> {
    if (!utils.validateId(id)) throw new Error('Invalid id');

    const data =
      this.getFromCache(id) ||
      (await this.fetchUserData(id)) ||
      this.createBlankUserData(id);

    cacheMe.set(id + CachePointers.user, data);
    return data;
  }
}
