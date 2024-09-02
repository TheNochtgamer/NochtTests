import {
  type Sequelize,
  DataTypes,
  type Model,
  type ModelStatic,
} from 'sequelize';

export default function GuildDataModel(
  sequelize: Sequelize
): ModelStatic<Model<any, any>> {
  return sequelize.define(
    'Guild_data',
    {
      ds_id: {
        type: DataTypes.STRING(30),
        primaryKey: true,
      },
      prefix: {
        type: DataTypes.STRING(5),
        defaultValue: '>',
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
    }
  );
}
