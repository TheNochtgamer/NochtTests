import type { AgsUserData as IAgsUserData } from '@/types';
import AgsUserData from '@/lib/structures/AGS/AgsUserData';
import DatabaseManager from './DatabaseManager';

export default class AgsUsersManager {
  public static async createUserToken(
    data: Omit<AgsUserData, 'user_id'>
  ): Promise<AgsUserData | null> {
    const res = await DatabaseManager.query(
      `
      CALL create_ags_users_tokens(?, ?, ?, ?)
      `,
      [data.ds_id, data.reference, data.priority, data.token]
    );

    if (!res || res.length === 0) return null;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const newData = new AgsUserData(res[0]);
    return newData;
  }

  public static async updateUserToken(data: AgsUserData): Promise<void> {
    await DatabaseManager.query(`CALL update_ags_user_tokens(?, ?, ?, ?, ?)`, [
      data.user_id,
      data.ds_id,
      data.reference,
      data.priority,
      data.token,
    ]);
  }

  public static async getUserToken(tableData: {
    user_id?: string;
    ds_id?: string;
    reference?: string;
  }): Promise<AgsUserData | null> {
    if (!tableData.user_id && !tableData.ds_id && !tableData.reference)
      return null;

    let data = null;

    if (tableData.user_id) {
      data = await DatabaseManager.query<AgsUserData>(
        `SELECT * FROM ags_user_tokens WHERE user_id = ?`,
        [tableData.user_id]
      );
    } else if (tableData.ds_id) {
      data = await DatabaseManager.query<AgsUserData>(
        `SELECT * FROM ags_user_tokens WHERE ds_id = ?`,
        [tableData.ds_id]
      );
    } else {
      data = await DatabaseManager.query<AgsUserData>(
        `SELECT * FROM ags_user_tokens WHERE reference = ?`,
        [tableData.reference]
      );
    }

    if (!data || data.length === 0) return null;

    return new AgsUserData(data[0]);
  }

  public static async getUsersTokens(): Promise<AgsUserData[] | null> {
    const data = await DatabaseManager.query<AgsUserData>(
      `SELECT * FROM ags_user_tokens`
    );

    if (!data || data.length === 0) return null;

    return data.map(d => new AgsUserData(d));
  }
}