import { Model } from 'sequelize';

interface IDsIdsModelAttributes {
  ds_id: string;
  type: 'user' | 'guild' | 'channel';
}

export default class DsIdsModel
  extends Model<IDsIdsModelAttributes>
  implements IDsIdsModelAttributes
{
  public ds_id!: string;
  public type!: 'user' | 'guild' | 'channel';
}
