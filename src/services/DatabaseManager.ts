import { Sequelize } from 'sequelize';
import SystemLog from '../lib/structures/SystemLog';
import UserDataModelFactory from '../lib/models/UserData.model';
import GuildDataModelFactory from '../lib/models/GuildData.model';
import DisabledCommandsFactory from '../lib/models/DisabledCommands.model';

const logger = new SystemLog('services', 'DatabaseManager');

class Database {
  public readonly sequelize: Sequelize;
  public _connected: boolean = false;

  // Models
  public readonly UserDataModel;
  public readonly GuildDataModel;
  public readonly DisabledCommandsModel;

  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'mssql',
      // dialectModule: MsSqlDialect,
      host: 'localhost',
      database: process.env.BASE_NAME,

      // username: process.env.BASE_AUTH_USER,
      // password: process.env.BASE_AUTH_PASS,

      dialectOptions: {
        authentication: {
          type: 'default',
          options: {
            userName: process.env.BASE_AUTH_USER,
            password: process.env.BASE_AUTH_PASS,
          },
        },
        options: {
          instanceName: 'SQLEXPRESSS',
          encrypt: true,
          trustServerCertificate: true,
        },
      },

      pool: {
        max: 5,
        min: 0,
        idle: 30 * 1000,
        acquire: 31 * 1000,
      },
    });

    this.UserDataModel = UserDataModelFactory(this.sequelize);
    this.GuildDataModel = GuildDataModelFactory(this.sequelize);
    this.DisabledCommandsModel = DisabledCommandsFactory(this.sequelize);
    //
  }

  public async sync(): Promise<void> {
    try {
      await this.sequelize.sync({
        force: false,
      });
      logger.log('sync', 'Base de datos sincronizada correctamente');
    } catch (error) {
      logger.error('sync', 'No se pudo sincronizar la base de datos:', error);
    }
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
    try {
      logger.log('connect', 'Conectando a la base de datos...');
      await this.sequelize.authenticate();
      this._connected = true;
      logger.log('connect', 'Conexion establecida exitosamente.');

      void this.sync();
    } catch (error) {
      logger.error('connect', 'No se pudo conectar a la base de datos:', error);
      logger.log('connect', 'Reintentando conexion en 5s...');
      setTimeout(async () => {
        await this.connect();
      }, 5 * 1000);
    }
  }
}

export default new Database();
