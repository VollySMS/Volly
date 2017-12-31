'use strict';

require('./lib/setup');
const faker = require('faker');
const server = require('../lib/server');
const superagent = require('superagent');
const volunteerMockFactory = require('./lib/volunteer-mock-factory');

const Company = require('../model/company');
const Volunteer = require('../model/volunteer');


describe('volunteer-auth-router.js', () => {
  beforeAll(server.start);
  afterAll(server.stop);
  afterEach(volunteerMockFactory.remove);

  describe('POST /volunteer/signup', () => {
    test('creating an account should respond with a 200 status and a token', () => {
      return superagent.post(`${process.env.API_URL}/volunteer/signup`)
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
      return superagent.post(`${process.env.API_URL}/volunteer/signup`)
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
          return superagent.post(`${process.env.API_URL}/volunteer/signup`)
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

  describe('GET /volunteer/login', () => {
    test('should respond with a 200 and a token', () => {
      return volunteerMockFactory.create()
        .then(mock => {
          return superagent.get(`${process.env.API_URL}/volunteer/login`)
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
          return superagent.get(`${process.env.API_URL}/volunteer/login`);
        })
        .then(Promise.reject)
        .catch( response => {
          expect(response.status).toEqual(400);
        });
    });

    test('should respond with a 400 if authorization is sent without basic', () => {
      return volunteerMockFactory.create()
        .then(() => {
          return superagent.get(`${process.env.API_URL}/volunteer/login`)
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
          return superagent.get(`${process.env.API_URL}/volunteer/login`)
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
          return superagent.get(`${process.env.API_URL}/volunteer/login`)
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
          return superagent.get(`${process.env.API_URL}/volunteer/login`)
            .auth(mock.request.userName, 'invalidPassword');
        })
        .then(Promise.reject)
        .catch( response => {
          expect(response.status).toEqual(401);
        });
    });
  });

  describe('POST /volunteer/apply', () => {
    afterEach(volunteerMockFactory.remove);

    test('applying to company should respond with a 200 status', () => {
      return volunteerMockFactory.createWithCompany()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/volunteer/apply`)
            .set('Authorization', `Bearer ${mock.volunteerToken}`)
            .send({
              companyId: mock.company._id,
            })
            .then(response => {
              expect(response.status).toEqual(200);
              return Company.findById(mock.company._id);
            })
            .then(company => {
              expect(company.pendingVolunteers[0]).toEqual(mock.volunteer._id);
              return Volunteer.findById(mock.volunteer._id);
            })
            .then(volunteer => {
              expect(volunteer.pendingCompanies[0]).toEqual(mock.company._id);
            });
        });
    });

    test('should return status code 400 if invalid company id is provided', () => {
      return volunteerMockFactory.createWithCompany()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/volunteer/apply`)
            .set('Authorization', `Bearer ${mock.volunteerToken}`)
            .send({
              invalidId: mock.company._id,
            })
            .then(Promise.reject)
            .catch(response => {
              expect(response.status).toEqual(400);
            });
        });
    });

    test('applying to the same company while still pending should return a 409', () => {
      return volunteerMockFactory.createAndAdd()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/volunteer/apply`)
            .set('Authorization', `Bearer ${mock.volunteerToken}`)
            .send({
              companyId: mock.company._id,
            });
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(409);
        });
    });

    test('should respond with a 404 status if you apply to a company that cannot be found', () => {
      return volunteerMockFactory.createWithCompany()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/volunteer/apply`)
            .set('Authorization', `Bearer ${mock.volunteerToken}`)
            .send({
              companyId: 'fake-company-id',
            });
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(404);
        });
    });

    test('should respond with a 401 status if you fail to send valid Bearer auth', () => {
      return volunteerMockFactory.createWithCompany()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/volunteer/apply`)
            .set('Authorization', `Bearer bad-auth-token`)
            .send({
              companyId: mock.company._id,
            });
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(401);
        });
    });

    test('should respond with a 400 status if bearer auth is not sent', () => {
      return volunteerMockFactory.createWithCompany()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/volunteer/apply`)
            .send({
              companyId: mock.company._id,
            });
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(400);
        });
    });

    test('should respond with a 400 status if no token is sent with the bearer auth', () => {
      return volunteerMockFactory.createWithCompany()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/volunteer/apply`)
            .set('Authorization', `Bearer`)
            .send({
              companyId: mock.company._id,
            });
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(400);
        });
    });

    test('should respond with a 404 status if no account is found with the given token', () => {
      return volunteerMockFactory.createWithCompany()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/volunteer/apply`)
            .set('Authorization', `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlblNlZWQiOiIzNDBkY2JhOGQyOGY3OTUzZjcxOGM0NzQ0NDY3ZjRjMTNkMTc5YjQ3MTQ4OWNjZjA0ZThkODJhN2I4MzdiZWRjZjEwNTRiODgwMDFjNjEwYzRmYzJiYzVmMjI2NGU2OTcyMGYwZjY0OTMwYzNiYjVlYmFiNTJiMDgwYTg4ZmJkYiIsImlhdCI6MTUxNDc0OTU5N30.14ukuDv4Zo6Ch29UW1Qa0RKXdOgSaRx9jiXIRJA35mI`)
            .send({
              companyId: mock.company._id,
            });
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(404);
        });
    });
  });

  describe('PUT /volunteer/leave', () => {
    test('should return a 200 if pending company is successfully updated', () => {
      let mock = {};
      return volunteerMockFactory.createAndAdd()
        .then(mockData => {
          mock = mockData;
          expect(mock.company.pendingVolunteers[0].toString()).toEqual(mock.volunteer._id.toString());
          expect(mock.volunteer.pendingCompanies[0].toString()).toEqual(mock.company._id.toString());
        })
        .then(() => {
          return superagent.put(`${process.env.API_URL}/volunteer/leave`)
            .set('Authorization', `Bearer ${mock.volunteerToken}`)
            .send({
              companyId: mock.company._id,
            });
        })
        .then(response => {
          expect(response.body.volunteer.pendingCompanies.length).toEqual(0);
          expect(response.status).toEqual(200);
          return Company.findById(mock.company._id);
        })
        .then(company => {
          expect(company.pendingVolunteers.length).toEqual(0);
        });
    });
  });
});
