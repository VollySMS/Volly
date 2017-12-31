'use strict';

require('./lib/setup');
const faker = require('faker');
const server = require('../lib/server');
const superagent = require('superagent');
const volunteerMockFactory = require('./lib/volunteer-mock-factory');

describe('volunteer-auth-router.js', () => {
  beforeAll(server.start);
  afterAll(server.stop);
  afterEach(volunteerMockFactory.remove);

  describe('POST /volunteer-signup', () => {
    test('creating an account should respond with a 200 status and a token', () => {
      return superagent.post(`${process.env.API_URL}/volunteer-signup`)
        .send({
          name: faker.name.firstName() + ' ' + faker.name.lastName(),
          userName: faker.company.companyName(),
          password: faker.internet.password(),
          email: faker.internet.email(),
          phoneNumber: faker.phone.phoneNumber(),
        })
        .then(response => {
          expect(response.status).toEqual(200);
          expect(response.body.token).toBeTruthy();
        });
    });

    test('creating an account should respond with a 400 if a required field is missing', () => {
      return superagent.post(`${process.env.API_URL}/volunteer-signup`)
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
      let volunteer = null;
      return volunteerMockFactory.create()
        .then(mock => {
          volunteer = mock.volunteer;
          return superagent.post(`${process.env.API_URL}/volunteer-signup`)
            .send({
              name: faker.name.firstName() + ' ' + faker.name.lastName(),
              userName: volunteer.userName,
              password: faker.internet.password(),
              email: faker.internet.email(),
              phoneNumber: faker.phone.phoneNumber(),
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
          name: faker.name.firstName() + ' ' + faker.name.lastName(),
          userName: faker.company.companyName(),
          password: faker.internet.password(),
          email: faker.internet.email(),
          phoneNumber: faker.phone.phoneNumber(),
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(404);
        });
    });
  });

  describe('GET /volunteer-login', () => {
    test('should respond with a 200 and a token', () => {
      return volunteerMockFactory.create()
        .then(mock => {
          return superagent.get(`${process.env.API_URL}/volunteer-login`)
            .auth(mock.request.userName, mock.request.password);
        })
        .then( response => {
          expect(response.status).toEqual(200);
          expect(response.body).toBeTruthy();
        });
    });

    test('should respond with a 400 if no auth header is included', () => {
      return volunteerMockFactory.create()
        .then(() => {
          return superagent.get(`${process.env.API_URL}/volunteer-login`);
        })
        .then(Promise.reject)
        .catch( response => {
          expect(response.status).toEqual(400);
        });
    });

    test('should respond with a 400 if authorization is sent without basic', () => {
      return volunteerMockFactory.create()
        .then(() => {
          return superagent.get(`${process.env.API_URL}/volunteer-login`)
            .set('Authorization', 'invalid');
        })
        .then(Promise.reject)
        .catch( response => {
          expect(response.status).toEqual(400);
        });
    });

    test('should respond with a 400 if basic auth is improperly encoded', () => {
      return volunteerMockFactory.create()
        .then(() => {
          return superagent.get(`${process.env.API_URL}/volunteer-login`)
            .set('Authorization', 'Basic invalid');
        })
        .then(Promise.reject)
        .catch( response => {
          expect(response.status).toEqual(400);
        });
    });

    test('should respond with a 404 if an invalid username or password is sent', () => {
      return volunteerMockFactory.create()
        .then(() => {
          return superagent.get(`${process.env.API_URL}/volunteer-login`)
            .auth('invalidUserName', 'invalidPassword');
        })
        .then(Promise.reject)
        .catch( response => {
          expect(response.status).toEqual(404);
        });
    });

    test('should respond with a 401 if a valid name used but an invalid password is sent', () => {
      return volunteerMockFactory.create()
        .then(mock => {
          return superagent.get(`${process.env.API_URL}/volunteer-login`)
            .auth(mock.request.userName, 'invalidPassword');
        })
        .then(Promise.reject)
        .catch( response => {
          expect(response.status).toEqual(401);
        });
    });

  });
});
