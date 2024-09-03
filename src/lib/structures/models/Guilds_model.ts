import { Model } from 'sequelize';

interface IGuildsModelAttributes {
  ds_id: string;
  prefix: string;
}

export default class GuildsModel
  extends Model<IGuildsModelAttributes>
  implements IGuildsModelAttributes
{
  public ds_id!: string;
  public prefix!: string;
}
