/* eslint-disable @typescript-eslint/naming-convention */
import type { AgsTokensData as TAgsTokensData } from '../types';
import AgsTokensData from '../lib/structures/AGS/AgsTokensData';
import DatabaseManager from './DatabaseManager';

export default class AgsTokensManager {
  public static createAgsTokens(data: Partial<TAgsTokensData> & {user_id: string}): TAgsTokensData {
    const newData = new AgsTokensData(data);
    void this.updateAgsTokens(newData);
    return newData;
  }

  public static async updateAgsTokens(data: AgsTokensData): Promise<void> {
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
  }): Promise<AgsTokensData | null> {
    if (!tableData.user_id || !tableData.ds_id || !tableData.refence)
      return null;

    const data = await DatabaseManager.query<AgsTokensData>(
      `SELECT * FROM ags_users_tokens WHERE user_id = ? AND ds_id = ? AND refence = ?`,
      [tableData.user_id, tableData.ds_id, tableData.refence]
    );

    if (!data || data.length === 0) return null;

    return new AgsTokensData(data[0]);
  }

  public static async getAgsTokens(): Promise<AgsTokensData[] | null> {
    const data = await DatabaseManager.query<AgsTokensData>(
      `SELECT * FROM ags_users_tokens`
    );

    if (!data || data.length === 0) return null;

    return data.map(d => new AgsTokensData(d));
  }
}
