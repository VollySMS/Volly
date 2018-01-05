'use strict';

require('dotenv').config();

const pa = require('./model/pending-account');
const vms = require('./__test__/lib/volunteer-mock-factory');
const server = require('./lib/server');

server.start()
  .then(() => {
    console.log(`Server running on port ${process.env.PORT}`);
  })
  .then(() => vms.createExpired())
  .then(() => pa.removeExpired())
  .catch(console.log);