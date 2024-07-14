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
    'userdata',
    {
      ds_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      blockedReason: {
        type: DataTypes.STRING,
        defaultValue: null,
      },

      // experimental
      echo: {
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
