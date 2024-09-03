import { Model } from 'sequelize';

interface IDisabledCommandsModelAttributes {
  ds_id: string;
  name: string;
  type: 'user' | 'guild' | 'global';
  reason: string | null;
}

export default class DisabledCommandsModel
  extends Model<IDisabledCommandsModelAttributes>
  implements IDisabledCommandsModelAttributes
{
  public ds_id!: string;
  public name!: string;
  public type!: 'user' | 'guild' | 'global';
  public reason!: string;
}
