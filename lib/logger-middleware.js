'use strict';

const logger = require('./logger');

module.exports = (request, response, next) => {
  logger.info(`Processing : ${request.method} on : ${request.url}`);
  return next();
};