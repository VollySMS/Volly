'use strict';

require('./lib/setup');

const server = require('../lib/server');

describe('server.js', () => {
  test('server should return an error if stopped while already off.', () => {
    return server.stop()
      .then(Promise.reject)
      .catch(response => {
        expect(response.message).toEqual('__SERVER_ERROR__ server is already OFF');
      });
  });

  test('server should return an error if stopped while already off, but httpServer variable triggered to true.', () => {
    return server.stop(true)
      .then(Promise.reject)
      .catch(response => {
        expect(response.message).toEqual('__SERVER_ERROR__ there is no server to close');
      });
  });
});