'use strict';

require('dotenv').config();

const server = require('./lib/server');

server.start()
  .catch(console.log);