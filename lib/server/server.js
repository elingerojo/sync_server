'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

const printInterfaces = require('./print_interfaces');
const send = require('./sender_functions');

function startServer({
  logger,
  syncHandler,
  settings,
  dataPath,
}) {
  const expressApp = express();

  expressApp.set('port', settings.port);
  expressApp.set('x-powered-by', false);

  expressApp.use(cors());
  expressApp.use(bodyParser.json({ limit: settings.requestSizeLimit }));

  expressApp.use('/', (req, res, next) => {
    // TODO print client ID etc.
    logger.file.info(req.path);
    logger.console.info(req.path);
    next();
  });

  expressApp.use('/', (req, res, next) => {
    const syncData = req.body;
    syncHandler(syncData)
      .then((data) => {
        send.jsonContent(res, data);
      })
      .catch((e) => {
        next(e);
      });
  });

  expressApp.use('/check', (req, res) => {
    res.end();
  });

  // catch 404 and forward to error handler
  expressApp.use(function (req, res, next) {
    // TODO fix this to pass status code
    const err = new Error('Not Found');
    next(err);
  });

  // Error handler
  expressApp.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
    logger.file.error(err.name, err.message);
    logger.console.error(err.name, err.message);
    send.error(res, {
      name: err.name,
      message: err.message,
    });
  });

  if (settings.protocol === 'http') {
    http.createServer(expressApp)
        .listen(expressApp.get('port'), () => {
          printInterfaces(logger, settings.protocol, settings.port);
        });
  } else if (settings.protocol === 'https') {
    const httpsSettings = settings.https;
    if (!httpsSettings) {
      throw new Error('Https configuration is missing');
    }
    const httpsOptions = Object
        .keys(httpsSettings)
        .reduce((opts, key) => Object.assign(
            opts,
            { [key]: fs.readFileSync(path.join(dataPath, httpsSettings[key])) }
        ));
    https.createServer(httpsOptions, expressApp)
        .listen(expressApp.get('port'), () => {
          printInterfaces(logger, settings.protocol, settings.port);
        });
  } else {
    throw new Error(`Protocol: ${settings.protocol} not supported`);
  }
}

module.exports = startServer;
