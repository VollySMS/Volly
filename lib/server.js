'use strict';

const express = require('express');
const mongoose = require('mongoose');

const logger = require('./logger');

const app = express();
let isServerOn = false;
let httpServer = null;

// ---------------------------------------------
// MONGODB
// ---------------------------------------------

mongoose.Promise = Promise;

// ---------------------------------------------
// LOGGER MIDDLEWARE
// ---------------------------------------------

app.use(require('./logger-middleware'));

// ---------------------------------------------
// ROUTES
// ---------------------------------------------

app.use(require('../route/company-auth-router'));
app.use(require('../route/volunteer-auth-router'));
app.use(require('../route/twilio-router'));

app.all('*', (request, response) => {
  logger.info(`Returning a 404 from the catch all.`);
  return response.sendStatus(404);
});

// ---------------------------------------------
// ERROR MIDDLEWARE
// ---------------------------------------------

app.use(require('./error-middleware'));

// ---------------------------------------------
// SERVER START and STOP
// ---------------------------------------------

const server = module.exports = {};

server.start = () => {
  return new Promise((resolve, reject) => { //eslint-disable-line
    httpServer = app.listen(process.env.PORT, () => {
      isServerOn = true;
      logger.info(`Server is listening on port ${process.env.PORT}`);
      return resolve();
    });
  })
    .then(mongoose.connect(process.env.MONGODB_URI, {useMongoClient: true}));
};

server.stop = (serverStatus = isServerOn) => {
  return new Promise((resolve, reject) => {
    if(!serverStatus){
      logger.error('__SERVER_ERROR__ server is already OFF');
      return reject(new Error('__SERVER_ERROR__ server is already OFF'));
    }

    if(!httpServer){
      logger.error('__SERVER_ERROR__ there is no server to close');
      return reject(new Error('__SERVER_ERROR__ there is no server to close'));
    }

    return httpServer.close(() => {
      isServerOn = false;
      httpServer = null;
      logger.log('info', 'Server is OFF');
      return resolve();
    });
  })
    .then(() => mongoose.disconnect());
};