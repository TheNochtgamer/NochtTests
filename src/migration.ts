import 'dotenv/config';
import 'module-alias/register';
import DatabaseManager from './services/DatabaseManager';
import Bot from './lib/structures/Bot';
import SystemLog from './lib/structures/SystemLog';
import Utils from './lib/Utils';

const logger = new SystemLog('migration');
const args = process.argv.slice(2).map(arg => arg.toLowerCase());

async function migrateDb() {
  await DatabaseManager.tryConnection().catch(reason => {
    logger.error('migrateDb', 'Error connecting to the database: ', reason);
    logger.error('migrateDb', 'Shutting down the system...');
    process.exit(1);
  });

  await DatabaseManager.migration();
}

async function migrateCmds() {
  const isGuild = args[1] === 'guild';
  const guildID = args[2];

  if (isGuild && !Utils.validateId(guildID)) {
    logger.error(
      'migrateCmds',
      'You must provide a valid guild ID to migrate commands for a specific guild'
    );
    process.exit(1);
  }

  const bot = new Bot({
    intents: [],
    partials: [],
    presence: { status: 'invisible' },
  });

  await bot.init(process.env.TOKEN ?? '', true);

  logger.log(
    'migrateCmds',
    `Migrating commands into (${
      isGuild ? `Guild: ${guildID}` : '⚠ Global ⚠'
    })...`
  );
  await Utils.summitCommands(bot);
}

void (async function Main() {
  const firstArg = args[0];

  if (firstArg.includes('command') || firstArg.includes('commands')) {
    logger.log('Main', 'Migrating commands...');
    await migrateCmds();
    logger.log('Main', 'Commands migration completed');
  } else if (firstArg.includes('db') || firstArg.includes('database')) {
    logger.log('Main', 'Migrating database...');
    await migrateDb();
    logger.log('Main', 'Database migration completed');
  } else if (firstArg.includes('all')) {
    logger.log('Main', 'Migrating all...');
    await migrateDb();
    await migrateCmds();
    logger.log('Main', 'All migrations completed');
  } else {
    // No arguments provided
    logger.log(
      'Main',
      'No arguments provided. Please provide one of the following arguments: \n- db\n- command (global: DEFAULT | guild) (guildID)\n- all'
    );
  }

  process.exit(0);
})();
