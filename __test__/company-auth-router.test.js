'use strict';

require('./lib/setup');

const faker = require('faker');
const superagent = require('superagent');

const server = require('../lib/server');
const Volunteer = require('../model/volunteer');
const companyMockFactory = require('./lib/company-mock-factory');
const volunteerMockFactory = require('./lib/volunteer-mock-factory');

describe('company-auth-router.js', () => {
  beforeAll(server.start);
  afterAll(server.stop);
  afterEach(volunteerMockFactory.remove);

  describe('POST /company/signup', () => {
    test('creating an account should respond with a 200 status and a token', () => {
      return superagent.post(`${process.env.API_URL}/company/signup`)
        .send({
          companyName: faker.company.companyName(),
          password: faker.internet.password(),
          email: faker.internet.email(),
          phoneNumber: faker.phone.phoneNumber(),
          website: faker.internet.url(),    
        })
        .then(response => {
          expect(response.status).toEqual(200);
          expect(response.body.token).toBeTruthy();
        });
    });

    test('creating an account should respond with a 400 if a required field is missing', () => {
      return superagent.post(`${process.env.API_URL}/company/signup`)
        .send({
          password: faker.internet.password(),
          email: faker.internet.email(),
          phoneNumber: faker.phone.phoneNumber(),
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
          return superagent.post(`${process.env.API_URL}/company/signup`)
            .send({
              companyName: company.companyName,
              password: faker.internet.password(),
              email: faker.internet.email(),
              phoneNumber: faker.phone.phoneNumber(),
              website: faker.internet.url(),    
            });
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(409);
        });
    });

    test('should respond with a 404 status if a bad endpoint is hit', () => {
      return superagent.post(`${process.env.API_URL}/bad-path`)
        .send({
          companyName: faker.company.companyName(),
          password: faker.internet.password(),
          email: faker.internet.email(),
          phoneNumber: faker.phone.phoneNumber(),
          website: faker.internet.url(),    
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(404);
        });
    });
  });

  describe('GET', () => {
    describe('GET /company/login', () => {
      test('should respond with a 200 and a token', () => {
        return companyMockFactory.create()
          .then(mock => {
            return superagent.get(`${process.env.API_URL}/company/login`)
              .auth(mock.request.companyName, mock.request.password);
          })
          .then( response => {
            expect(response.status).toEqual(200);
            expect(response.body).toBeTruthy(); // TODO: Should this be response.body.token???
          });
      });

      test('should respond with a 400 if no auth header is included', () => {
        return companyMockFactory.create()
          .then(() => {
            return superagent.get(`${process.env.API_URL}/company/login`);
          })
          .then(Promise.reject)
          .catch( response => {
            expect(response.status).toEqual(400);
          });
      });

      test('should respond with a 400 if authorization is sent without basic', () => {
        return companyMockFactory.create()
          .then(() => {
            return superagent.get(`${process.env.API_URL}/company/login`)
              .set('Authorization', 'invalid');
          })
          .then(Promise.reject)
          .catch( response => {
            expect(response.status).toEqual(400);
          });
      });

      test('should respond with a 400 if basic auth is improperly encoded', () => {
        return companyMockFactory.create()
          .then(() => {
            return superagent.get(`${process.env.API_URL}/company/login`)
              .set('Authorization', 'Basic invalid');
          })
          .then(Promise.reject)
          .catch( response => {
            expect(response.status).toEqual(400);
          });
      });

      test('should respond with a 404 if an invalid username or password is sent', () => {
        return companyMockFactory.create()
          .then(() => {
            return superagent.get(`${process.env.API_URL}/company/login`)
              .auth('invalidCompanyName', 'invalidPassword');
          })
          .then(Promise.reject)
          .catch( response => {
            expect(response.status).toEqual(404);
          });
      });

      test('should respond with a 401 if a valid name used but an invalid password is sent', () => {
        return companyMockFactory.create()
          .then(mock => {
            return superagent.get(`${process.env.API_URL}/company/login`)
              .auth(mock.request.companyName, 'invalidPassword');
          })
          .then(Promise.reject)
          .catch( response => {
            expect(response.status).toEqual(401);
          });
      });
    });

    describe('GET /company/pending', () => {
      test('should return a 200 if pending volunteers are successfully found', () => { // TODO: make this test better once we send back more detailed info
        let mock = {};
        return volunteerMockFactory.createAndAddPending()
          .then(mockData => {
            mock = mockData;
            return superagent.get(`${process.env.API_URL}/company/pending`)
              .set('Authorization', `Bearer ${mock.companyToken}`);
          })
          .then(response => {
            expect(response.body.pendingVolunteers[0].toString()).toEqual(mock.volunteer._id.toString());
            expect(response.status).toEqual(200);
          });
      });
    });
  });

  describe('PUT', () => {
    describe('PUT /company/approve', () => {
      test('should return object with active and pending volunteers arrays', () => { // TODO: might need to fix this test when more detailed info is returned
        let mock = {};
        return volunteerMockFactory.createAndAddPending()
          .then(mockData => {
            mock = mockData;            
            return superagent.put(`${process.env.API_URL}/company/approve`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({volunteerId: mock.volunteer._id});
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.pendingVolunteers.length).toEqual(0);
            expect(response.body.activeVolunteers[0].toString()).toEqual(mock.volunteer._id.toString());
            return Volunteer.findById(mock.volunteer._id);
          })
          .then(volunteer => {
            expect(volunteer.pendingCompanies.length).toEqual(0);
            expect(volunteer.activeCompanies[0].toString()).toEqual(mock.company._id.toString());
          });
      });
    });
  });
});
