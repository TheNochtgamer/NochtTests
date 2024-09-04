import 'dotenv/config';
import DatabaseManager from './services/DatabaseManager';
import SystemLog from './lib/structures/SystemLog';

const logger = new SystemLog('services', 'DatabaseManager');

void (async function Main() {
  await DatabaseManager.tryConnection().catch(reason => {
    logger.error('migration', 'Error connecting to the database: ', reason);
    logger.error('migration', 'Shutting down the system...');
    process.exit(1);
  });

  await DatabaseManager.migration();

  logger.log('migration', 'Migration completed');
})();
