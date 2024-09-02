import {
  type Sequelize,
  DataTypes,
  type Model,
  type ModelStatic,
} from 'sequelize';

export default function DisabledCommandsModel(
  sequelize: Sequelize
): ModelStatic<Model<any, any>> {
  return sequelize.define(
    'Disabled_commands',
    {
      name: {
        type: DataTypes.STRING(30),
        primaryKey: true,
      },
      ds_id: {
        type: DataTypes.STRING(30),
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM,
        values: ['user', 'guild', 'global'],
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING(50),
        defaultValue: null,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
    }
  );
}
