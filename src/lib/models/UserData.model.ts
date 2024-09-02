import {
  type Sequelize,
  DataTypes,
  type Model,
  type ModelStatic,
} from 'sequelize';
// import type { UserData as UserDataType } from '../types';

export default function UserDataModel(
  sequelize: Sequelize
): ModelStatic<Model<any, any>> {
  return sequelize.define(
    'User_data',
    {
      ds_id: {
        type: DataTypes.STRING(30),
        primaryKey: true,
      },
      blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      blocked_reason: {
        type: DataTypes.STRING(50),
        defaultValue: null,
      },

      // experimental
      echo_activated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
    }
  );
}
