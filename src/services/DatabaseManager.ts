import {
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import SystemLog from '../lib/structures/SystemLog';
import UsersModelBuilder from '../lib/structures/models/Users_model';
import GuildsModelBuilder from '../lib/structures/models/Guilds_model';
import DsIdsModelBuilder from '../lib/structures/models/DsIds_Model';
import DisabledCommandsModel from '../lib/structures/models/DisabledCommands_model';

// import UserDataModelFactory from '../lib/models/UserData.model';
// import GuildDataModelFactory from '../lib/models/GuildData.model';
// import DisabledCommandsFactory from '../lib/models/DisabledCommands.model';

const logger = new SystemLog('services', 'DatabaseManager');

class Database {
  public readonly sequelize: Sequelize;
  public _connected: boolean = false;

  // Models
  // public readonly DsIdsModel;
  public readonly UserDataModel;
  public readonly GuildDataModel;
  public readonly DisabledCommandsModel;

  constructor() {
    const sequelize = new Sequelize({
      dialect: 'mysql',
      host: process.env.BASE_IP,
      database: process.env.BASE_NAME,

      username: process.env.BASE_AUTH_USER,
      password: process.env.BASE_AUTH_PASS,

      pool: {
        max: 5,
        min: 0,
        idle: 30 * 1000,
        acquire: 31 * 1000,
      },
    });
    this.sequelize = sequelize;

    // MODELS DECLARATION

    // this.DsIdsModel = DsIdsModelBuilder.init(
    //   {
    //     ds_id: {
    //       type: DataTypes.STRING(30),
    //       primaryKey: true,
    //     },
    //     type: {
    //       type: DataTypes.ENUM,
    //       values: ['user', 'guild', 'channel'],
    //       allowNull: false,
    //     },
    //   },
    //   {
    //     modelName: 'Ids',
    //     timestamps: false,
    //     freezeTableName: true,
    //     sequelize,
    //   }
    // );

    this.UserDataModel = UsersModelBuilder.init(
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
        modelName: 'Users',
        timestamps: false,
        freezeTableName: true,
        sequelize,
      }
    );

    this.GuildDataModel = GuildsModelBuilder.init(
      {
        ds_id: {
          type: DataTypes.STRING(30),
          primaryKey: true,
        },
        prefix: {
          type: DataTypes.STRING(5),
          defaultValue: '!',
        },
      },
      {
        modelName: 'Guilds',
        timestamps: false,
        freezeTableName: true,
        sequelize,
      }
    );

    this.DisabledCommandsModel = DisabledCommandsModel.init(
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
        modelName: 'Disabled_Commands',
        timestamps: false,
        freezeTableName: true,
        sequelize,
      }
    );

    // this.UserDataModel.beforeCreate((instance, options) => {
    //   if (!instance.ds_id) {
    //     throw new Error('No se puede crear un usuario sin un ID.');
    //   }

    //   this.DsIdsModel.findOrCreate({
    //     where: {
    //       ds_id: instance.ds_id,
    //       type: 'user',
    //     },
    //   });
    // });
    this.UserDataModel.hasMany(this.DisabledCommandsModel, {
      foreignKey: 'ds_id',
      sourceKey: 'ds_id',
    });

    // this.GuildsModel.beforeCreate((instance, options) => {
    //   if (!instance.ds_id) {
    //     throw new Error('No se puede crear un servidor sin un ID.');
    //   }

    //   this.DsIdsModel.findOrCreate({
    //     where: {
    //       ds_id: instance.ds_id,
    //       type: 'guild',
    //     },
    //   });
    // });
    // this.GuildsModel.hasMany(this.DisabledCommandsModel, {
    //   foreignKey: 'ds_id',
    //   sourceKey: 'ds_id',
    // });

    // this.DisabledCommandsModel.belongsTo(this.DsIdsModel, {
    //   foreignKey: 'ds_id',
    //   targetKey: 'ds_id',
    // });

    //
  }

  public async sync(): Promise<void> {
    try {
      await this.sequelize.sync({
        force: false,
        alter: true,
      });
      logger.log('sync', 'Base de datos sincronizada correctamente');
    } catch (error) {
      logger.error('sync', 'No se pudo sincronizar la base de datos:', error);
    }
  }

  private async _myConnect(): Promise<void> {
    logger.log('connect', 'Conectando a la base de datos...');
    await this.sequelize.authenticate();
    this._connected = true;
    logger.log('connect', 'Conexion establecida exitosamente.');
  }

  public async connect(): Promise<void> {
    if (
      !process.env.BASE_IP ||
      !process.env.BASE_NAME ||
      !process.env.BASE_AUTH_USER ||
      !process.env.BASE_AUTH_PASS
    ) {
      logger.error(
        'connect',
        'Faltan variables de entorno para la conexion a la base de datos.'
      );
      return;
    }
    let tries = 0;

    while (!this._connected && tries < 5) {
      try {
        this._myConnect();
      } catch (error) {
        tries++;
        logger.error(
          'connect',
          'No se pudo conectar a la base de datos:',
          error
        );
        logger.log('connect', 'Reintentando conexion en 5s...');
        setTimeout(async () => {
          await this._myConnect();
        }, 5 * 1000);
      }
    }
    if (!this._connected)
      throw new Error(
        'No se pudo conectar a la base de datos despues de 5 intentos.'
      );
  }
}

export default new Database();
