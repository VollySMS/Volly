'use strict';

require('./lib/setup');

const superagent = require('superagent');
const server = require('../lib/server');
const volunteerMockFactory = require('./lib/volunteer-mock-factory');

describe('phone-verify-router.js', () => {
  beforeAll(server.start);
  afterAll(server.stop);
  afterEach(volunteerMockFactory.remove);

  describe('POST /verify', () => {    
    test('should respond 200 when data is missing', () => {
      return volunteerMockFactory.create(true)
        .then(() => {
          return superagent.post(`${process.env.API_URL}/verify`);
        })
        .then(response => {
          expect(response.status).toEqual(200);
        });
    });
  });
});