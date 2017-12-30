'use strict';

require('dotenv').config();

const server = require('./lib/server');

server.start()
  .then(() => {
    console.log(`Server running on port ${process.env.PORT}`);
  })
  .catch(console.log);