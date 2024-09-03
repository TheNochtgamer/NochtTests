import { Model } from 'sequelize';

interface IUserDataModelAttributes {
  ds_id: string;
  blocked: boolean;
  blocked_reason: string | null;
  echo_activated: boolean;
}

export default class UsersModel
  extends Model<IUserDataModelAttributes>
  implements IUserDataModelAttributes
{
  public ds_id!: string;
  public blocked!: boolean;
  public blocked_reason!: string;
  public echo_activated!: boolean;
}
