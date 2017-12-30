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
    test('creating an account should respond with a 200 status and a token', () => {
      return superagent.post(`${process.env.API_URL}/company-signup`)
        .send({
          accountName: faker.company.companyName(),
          password: faker.internet.password(),
          email: faker.internet.email(),
        })
        .then(response => {
          expect(response.status).toEqual(200);
          expect(response.body.token).toBeTruthy();
        });
    });

    test('creating an account should respond with a 400 if a required field is missing', () => {
      return superagent.post(`${process.env.API_URL}/company-signup`)
        .send({
          password: faker.internet.password(),
          email: faker.internet.email(),
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(400);
        });
    });

    test('creating an account with duplicate information should return a 409', () => {
      let company = null;
      return companyMockFactory.create()
        .then(mock => {
          company = mock.company;
          return superagent.post(`${process.env.API_URL}/company-signup`)
            .send({
              accountName: company.accountName,
              password: faker.internet.password(),
              email: faker.internet.email(),
            });
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(409);
        });
    });

    test('should respond with a 404 status if a bad enpoint is hit', () => {
      return superagent.post(`${process.env.API_URL}/bad-path`)
        .send({
          accountName: faker.company.companyName(),
          password: faker.internet.password(),
          email: faker.internet.email(),
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(404);
        });
    });
  });
  describe('GET /company-login', () => {
    test('should respond with a 200 and a token', () => {
      return companyMockFactory.create()
        .then(mock => {
          return superagent.get(`${process.env.API_URL}/company-login`)
            .auth(mock.request.accountName, mock.request.password);
        })
        .then( response => {
          expect(response.status).toEqual(200);
          expect(response.body).toBeTruthy();
        });
    });
  });
});
