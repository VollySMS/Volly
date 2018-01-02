'use strict';

const logger = require('./logger');

module.exports = (error, request, response, next) => { //eslint-disable-line
  logger.info(error);

  if(error.status) {
    logger.info(`Message: ${error.message}. Responding with a ${error.status}.`);
    return response.sendStatus(error.status);
  }

  let message = error.message.toLowerCase();

  if(message.includes('validation failed')) {
    logger.info(`Schema validation failed. Responding with a 400.`);
    return response.sendStatus(400);
  }

  if(message.includes('duplicate key')) {
    logger.info(`Duplicate key found. Responding with a 409.`);
    return response.sendStatus(409);
  }

  if(message.includes('objectid failed')) {    
    logger.info(`Invalid id. Responding with a 404.`);
    return response.sendStatus(404);
  }

  if(message.includes('unauthorized') || message.includes('jwt malformed')) {
    logger.info(`Unauthorized. Responding with a 401.`);
    return response.sendStatus(401);
  }

  logger.info(`__SERVER_ERROR__ Responding with a 500.`);
  return response.sendStatus(500);
};
