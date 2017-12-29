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
// ROUTES
// ---------------------------------------------

// ---------------------------------------------
// ERROR MIDDLEWARE
// ---------------------------------------------

// ---------------------------------------------
// SERVER START and STOP
// ---------------------------------------------
const server = module.exports = {};

server.start = () => {
  return new Promise((resolve, reject) => {
    if(isServerOn){
      logger.log('error', '__SERVER_ERROR__ server is already ON');
      return reject(new Error('__SERVER_ERROR__ server is already ON'));
    }
    httpServer = app.listen(process.env.PORT, () => {
      isServerOn = true;
      console.log(`Server is listening on port ${process.env.PORT}`);
      logger.log(`Server is listening on port ${process.env.PORT}`);
      return resolve();
    });
  })
    .then(mongoose.connect(process.env.MONGODB_URI, {useMongoClient : true}));
};

server.stop = () => {
  return new Promise((resolve, reject) => {
    if(!isServerOn){
      logger.log('error', '__SERVER_ERROR__ server is already OFF');
      return reject(new Error('__SERVER_ERROR__ server is already OFF'));
    }

    if(!httpServer){
      logger.log('error', '__SERVER_ERROR__ there is no server to close');
      return reject(new Error('__SERVER_ERROR__ there is no server to close'));
    }

    httpServer.close(() => {
      isServerOn = false;
      httpServer = null;
      logger.log('info', 'Server is OFF');
      return resolve();
    });
  })
    .then(() => mongoose.disconnect());
};