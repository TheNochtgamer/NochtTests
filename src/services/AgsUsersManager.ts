import type { AgsUserData as IAgsUserData } from '@/types';
import AgsUserData from '@/lib/structures/AGS/AgsUserData';
import DatabaseManager from './DatabaseManager';

export default class AgsUsersTokensManager {
  public static createAgsTokens(
    data: Partial<AgsUserData> & { user_id: string }
  ): AgsUserData {
    const newData = new AgsUserData(data);
    void this.updateAgsTokens(newData);
    return newData;
  }

  public static async updateAgsTokens(data: AgsUserData): Promise<void> {
    await DatabaseManager.query(`CALL upsert_ags_users_tokens(?, ?, ?, ?, ?)`, [
      data.user_id,
      data.ds_id,
      data.refence,
      data.priority,
      data.token,
    ]);
  }

  public static async getAgsToken(tableData: {
    user_id?: string;
    ds_id?: string;
    refence?: string;
  }): Promise<AgsUserData | null> {
    if (!tableData.user_id && !tableData.ds_id && !tableData.refence)
      return null;

    const data = await DatabaseManager.query<AgsUserData>(
      `SELECT * FROM ags_users_tokens WHERE user_id = ? AND ds_id = ? AND refence = ?`,
      [tableData.user_id, tableData.ds_id, tableData.refence]
    );

    if (!data || data.length === 0) return null;

    return new AgsUserData(data[0]);
  }

  public static async getAgsTokens(): Promise<AgsUserData[] | null> {
    const data = await DatabaseManager.query<AgsUserData>(
      `SELECT * FROM ags_users_tokens`
    );

    if (!data || data.length === 0) return null;

    return data.map(d => new AgsUserData(d));
  }
}
