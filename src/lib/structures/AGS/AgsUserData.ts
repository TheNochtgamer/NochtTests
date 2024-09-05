type data = string | (Partial<AgsUserData> & { user_id: string });

export default class AgsUserData {
  public readonly user_id: string;
  public ds_id: string | null = null;
  public reference: string | null = null;
  public priority: number = 0;
  public token = '';

  constructor(data: data) {
    if (typeof data === 'string') {
      this.user_id = data;
      return;
    }

    this.user_id = data.user_id;
    if (data.ds_id !== undefined) this.ds_id = data.ds_id;
    if (data.reference !== undefined) this.reference = data.reference;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.token !== undefined) this.token = data.token;
  }
}