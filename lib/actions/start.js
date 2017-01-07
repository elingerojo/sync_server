'use strict';

const fs = require('fs');
const path = require('path');

const initializeLogger = require('../log_handlers');
const startServer = require('../server/server');
const initSyncHandler = require('../sync/init_handlers');
const DB = require('../db_connectors/NeDB/db');

module.exports = function (dataPath) {
  const settings = JSON.parse(fs.readFileSync(path.join(dataPath, 'config.json'), { encoding: 'utf8' }));

  const logger = initializeLogger(dataPath, settings.logging);

  process.on('uncaughtException', (err) => {
    logger.file.error(`uncaughtException: ${err}`);
    logger.console.error(`uncaughtException: ${err}`);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, p) => {
    logger.file.error(`unhandledRejection: ${reason} ${p}`);
    logger.console.error(`unhandledRejection: ${reason} ${p}`);
    process.exit(1);
  });

  const db = new DB(Object.assign({}, settings.db.opts, { dataPath }), logger);

  startServer({
    syncHandler: initSyncHandler(db, logger, settings.sync),
    logger,
    settings: settings.server,
    dataPath,
  });
};
