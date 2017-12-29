'use strict';

require('./lib/setup');
const faker = require('faker');
const server = require('../lib/server');
const superagent = require('superagent');
const companyMockFactory = require('./lib/company-mock-factory');

describe('company-auth-router.js', () => {
  beforeAll(server.start);
  afterAll(server.stop);
  afterEach(companyMockFactory.remove);

  describe('POST /company-signup', () => {
    test('creating an account should respond with a 200 status and a token.', () => {
      return superagent.post(`${process.env.API_URL}/company-signup`)
        .send({
          companyName: faker.company.companyName(),
          password: faker.internet.password(),
          email: faker.internet.email(),
        })
        .then(response => {
          expect(response.status).toEqual(200);
          expect(response.body.token).toBeTruthy();
        });
    });
  });
});