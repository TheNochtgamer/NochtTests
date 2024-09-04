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
    while (!connected && tries < 3) {
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
      const [rows] = await connection.query(query.replace('\n', ''), values);
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
      // ALL THE TABLES
      `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(30) PRIMARY KEY,
        blocked BOOLEAN DEFAULT FALSE,
        blocked_reason TEXT,
        echo_activated BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS guilds (
        id VARCHAR(30) PRIMARY KEY,
        prefix VARCHAR(5) DEFAULT '>'
      );

      CREATE TABLE IF NOT EXISTS bot_settings (
        name VARCHAR(30) PRIMARY KEY,
        maintenance BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS user_disabled_commands (
        ds_id VARCHAR(30),
        name VARCHAR(30),
        reason VARCHAR(64),
        PRIMARY KEY (ds_id, name),
        FOREIGN KEY (ds_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS guild_disabled_commands (
        ds_id VARCHAR(30),
        name VARCHAR(30),
        reason VARCHAR(64),
        PRIMARY KEY (ds_id, name),
        FOREIGN KEY (ds_id) REFERENCES guilds(id)
      );
      
      CREATE TABLE IF NOT EXISTS global_disabled_commands (
        name VARCHAR(30) PRIMARY KEY,
        reason VARCHAR(64)
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS ags_user_tokens (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        ds_id VARCHAR(30),
        reference VARCHAR(30),
        token VARCHAR(255),
        FOREIGN KEY (ds_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS ags_codes (
        code_id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(255)
        );

      CREATE TABLE IF NOT EXISTS ags_exchanges (
        user_id INT,
        code_id INT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        response TEXT,
        PRIMARY KEY (user_id, code_id), 
        FOREIGN KEY (code_id) REFERENCES ags_codes(code_id),
        FOREIGN KEY (user_id) REFERENCES ags_user_tokens(user_id)
      );
      `,
      // VIEWS
      `
      
      `,
      // PROCEDURES
      `

      `,
    ];

    for (const queryGruop of queries) {
      for (const query of queryGruop.split(';')) {
        const _query = query.replace('\n', '').trim();
        if (!_query) continue;
        await connection.query(_query);
      }
    }
    connection.release();
  }
}

export default new Database();
