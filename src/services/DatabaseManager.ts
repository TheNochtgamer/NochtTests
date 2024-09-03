import mysql from 'mysql2/promise';
import SystemLog from '../lib/structures/SystemLog';
import { setTimeout as delay } from 'node:timers/promises';

const logger = new SystemLog('services', 'DatabaseManager');

class Database {
  public readonly dbPool: mysql.Pool;

  constructor() {
    this.dbPool = mysql.createPool({
      host: process.env.BASE_IP,
      user: process.env.BASE_AUTH_USER,
      password: process.env.BASE_AUTH_PASS,
      database: process.env.BASE_NAME,

      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  async tryConnection(): Promise<void> {
    let tries = 0;
    let connected = false;
    while (tries < 3) {
      try {
        const connection = await this.dbPool.getConnection();
        await connection.query('SELECT 1');
        logger.log('tryConnection', 'Conexión exitosa');
        connection.release();
        connected = true;
      } catch (error) {
        if (error instanceof Error)
          logger.error('tryConnection', `Error al intentar conectarse:`, error);
        logger.error('tryConnection', 'Intentando de nuevo en 5s...');
        await delay(5000);
        tries++;
      }
    }

    if (!connected)
      throw new Error(
        'Demasiados intentos fallidos de conexión a la base de datos'
      );
  }

  async query<R = any>(query: string, values: any[] = []): Promise<R> {
    try {
      const connection = await this.dbPool.getConnection();
      const [rows] = await connection.query(query, values);
      connection.release();
      return rows as R;
    } catch (error) {
      if (error instanceof Error)
        logger.error('query', `Error on query: ${error.message}`);
      return null as R;
    }
  }

  async migration(): Promise<void> {
    const connection = await this.dbPool.getConnection();

    const queries = [
      `
      CREATE TABLE IF NOT EXISTS users (
        ds_id VARCHAR(30) PRIMARY KEY,
        blocked BOOLEAN DEFAULT FALSE,
        blocked_reason TEXT,
        echo_activated BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS guilds (
        ds_id VARCHAR(30) PRIMARY KEY,
        blocked BOOLEAN DEFAULT FALSE,
        blocked_reason TEXT,
        echo_activated BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS disabled_commands (
        ds_id VARCHAR(30),
        name VARCHAR(30),
        reason TEXT,
        type ENUM('user', 'guild', 'channel'),
        PRIMARY KEY (id, name),
      );
    `,
      `
      DROP PROCEDURE IF EXISTS updsert_user_data;
      CREATE PROCEDURE updsert_user_data( 
        IN id VARCHAR(30),
        IN blocked BOOLEAN,
        IN blocked_reason TEXT,
        IN echo_activated BOOLEAN,
      )
      BEGIN
        INSERT INTO users (ds_id, blocked, blocked_reason, echo_activated) 
        VALUES (id, blocked, blocked_reason, echo_activated) 
        ON DUPLICATE KEY UPDATE blocked = VALUES(blocked), blocked_reason = VALUES(blocked_reason), echo_activated = VALUES(echo_activated);
      END;
      `,
      `
      DROP PROCEDURE IF EXISTS updsert_guild_data;
      CREATE PROCEDURE updsert_guild_data(
        IN id VARCHAR(30),
        IN blocked BOOLEAN,
        IN blocked_reason TEXT,
        IN echo_activated BOOLEAN
      )
      BEGIN
        INSERT INTO guilds (ds_id, blocked, blocked_reason, echo_activated)
        VALUES (id, blocked, blocked_reason, echo_activated)
        ON DUPLICATE KEY UPDATE blocked = VALUES(blocked), blocked_reason = VALUES(blocked_reason), echo_activated = VALUES(echo_activated);
      END;
      `,
      `
      DROP PROCEDURE IF EXISTS updsert_disabled_commands;
      CREATE PROCEDURE updsert_disabled_commands(
        IN id VARCHAR(30),
        IN name VARCHAR(30),
        IN reason TEXT,
        IN type ENUM('user', 'guild', 'channel')
      )
      BEGIN
        INSERT INTO disabled_commands (ds_id, name, reason, type)
        VALUES (id, name, reason, type)
        ON DUPLICATE KEY UPDATE reason = VALUES(reason), type = VALUES(type);
      END;
      `,
      `
      DROP PROCEDURE IF EXISTS delete_disabled_commands;
      CREATE PROCEDURE delete_disabled_commands(
        IN id VARCHAR(30),
        IN name VARCHAR(30)
      )
      BEGIN
        DELETE FROM disabled_commands WHERE ds_id = id AND name = name;
      END;      
      `,
      `
      CREATE VIEW v_users_data AS
      SELECT *
      FROM users u
      LEFT JOIN disabled_commands dc
      ON u.ds_id = dc.ds_id;
      ORDER BY u.ds_id;
      `,
      `
      CREATE VIEW v_disabled_commands AS
      SELECT *
      FROM disabled_commands dc
      ORDER BY dc.ds_id;
      `,
      `
      CREATE VIEW v_guilds_data AS
      SELECT *
      FROM guilds g
      LEFT JOIN disabled_commands dc
      ON g.ds_id = dc.ds_id;
      `,
    ];

    for (const query of queries) {
      await connection.query(query);
    }
    connection.release();
  }
}

export default new Database();
