'use strict';

require('./lib/setup');

const faker = require('faker');
const superagent = require('superagent');

const server = require('../lib/server');
const Company = require('../model/company');
const Volunteer = require('../model/volunteer');
const volunteerMockFactory = require('./lib/volunteer-mock-factory');

const TEXTABLE_NUMBER = '+17787471077';

describe('volunteer-auth-router.js', () => {
  beforeAll(server.start);
  afterAll(server.stop);
  afterEach(volunteerMockFactory.remove);

  describe('POST', () => {
    describe('POST /volunteer/signup', () => {
      test('creating an account should respond with a 200 status and a token', () => {
        return superagent.post(`${process.env.API_URL}/volunteer/signup`)
          .send({
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            userName: faker.company.companyName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
            phoneNumber: TEXTABLE_NUMBER,
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.token).toBeTruthy();
          });
      });

      test('creating an account and subscribing to text notification should respond with a 200 status and a token', () => {
        return superagent.post(`${process.env.API_URL}/volunteer/signup?subscribe=true`)
          .send({
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            userName: faker.company.companyName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
            phoneNumber: TEXTABLE_NUMBER,
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.token).toBeTruthy();
          });
      });

      test('creating an account should respond with a 400 status if an invalid phone number is sent', () => {
        return superagent.post(`${process.env.API_URL}/volunteer/signup`)
          .send({
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            userName: faker.company.companyName(),
            password: faker.internet.password(),
            email: faker.internet.email(),            
            phoneNumber: '+17787471231077',
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });

      test('creating an account should respond with a 400 status if an invalid email is sent', () => {
        return superagent.post(`${process.env.API_URL}/volunteer/signup`)
          .send({
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            userName: faker.company.companyName(),
            password: faker.internet.password(),
            email: 'invalid email',
            phoneNumber: TEXTABLE_NUMBER,
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
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
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                userName: volunteer.userName,
                password: faker.internet.password(),
                email: faker.internet.email(),
                phoneNumber: TEXTABLE_NUMBER,
              });
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(409);
          });
      });
    });
  });


  describe('GET', () => {
    describe('GET /volunteer/login', () => {
      test('should respond with a 200 and a token', () => {
        return volunteerMockFactory.create()
          .then(mock => {
            return superagent.get(`${process.env.API_URL}/volunteer/login`)
              .auth(mock.request.userName, mock.request.password);
          })
          .then( response => {
            expect(response.status).toEqual(200);
            expect(response.body.token).toBeTruthy();
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

    describe('GET /volunteer/opportunities', () => {
      test('should respond with array of companies to apply for', () => {
        let mock = {};
        return volunteerMockFactory.createWithCompany()
          .then(mockData => {
            mock = mockData;
            return superagent.get(`${process.env.API_URL}/volunteer/opportunities`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`);
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.companies[0]).toEqual({
              companyId: mock.company._id.toString(),
              companyName: mock.company.companyName,
              phoneNumber: mock.company.phoneNumber,
              email: mock.company.email,
              website: mock.company.website,
            });
          });
      });
    });

    describe('GET /volunteer/pending', () => {
      test('should return a 200 if pending companies are successfully found', () => {
        let mock = {};
        return volunteerMockFactory.createAndAddPending()
          .then(mockData => {
            mock = mockData;
            return superagent.get(`${process.env.API_URL}/volunteer/pending`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`);
          })
          .then(response => {
            expect(response.body.pendingCompanies[0]).toEqual({
              companyId: mock.company._id.toString(),
              companyName: mock.company.companyName,
              phoneNumber: mock.company.phoneNumber,
              email: mock.company.email,
              website: mock.company.website,
            });
            expect(response.status).toEqual(200);
          });
      });
    });

    describe('GET /volunteer/active', () => {
      test('should return a 200 if active companies are successfully found', () => {
        let mock = {};
        return volunteerMockFactory.createAndAddActive()
          .then(mockData => {
            mock = mockData;
            return superagent.get(`${process.env.API_URL}/volunteer/active`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`);
          })
          .then(response => {
            expect(response.body.activeCompanies[0]).toEqual({
              companyId: mock.company._id.toString(),
              companyName: mock.company.companyName,
              phoneNumber: mock.company.phoneNumber,
              email: mock.company.email,
              website: mock.company.website,
            });
            expect(response.status).toEqual(200);
          });
      });
    });
  });


  describe('PUT', () => {
    afterEach(volunteerMockFactory.remove);

    describe('PUT /volunteer/update', () => {
      test('should return object with updated volunteer information', () => {
        let newData = null;
        return volunteerMockFactory.create()
          .then(mock => {
            newData = {
              firstName: faker.name.firstName(),
              lastName: faker.name.lastName(),
              userName: faker.company.companyName(),
              password: faker.internet.password(),
              email: faker.internet.email(),
              phoneNumber: '(778) 747-1078',
            };
            return superagent.put(`${process.env.API_URL}/volunteer/update`)
              .set('Authorization', `Bearer ${mock.token}`)
              .send(newData);
          })
          .then(response => {
            expect(response.body.userName).toEqual(newData.userName);
            expect(response.body.email).toEqual(newData.email);
            expect(response.body.phoneNumber).toEqual('+17787471078');
            expect(response.body.firstName).toEqual(newData.firstName);
            expect(response.body.lastName).toEqual(newData.lastName);
            expect(response.body.token).toBeTruthy();
            expect(response.status).toEqual(200);
          });
      });

      test('update and subscribe query should return object with updated volunteer information', () => {
        let newData = null;
        return volunteerMockFactory.create()
          .then(mock => {
            newData = {
              firstName: faker.name.firstName(),
              lastName: faker.name.lastName(),
              userName: faker.company.companyName(),
              password: faker.internet.password(),
              email: faker.internet.email(),
              phoneNumber: '(778) 747-1078',
            };
            return superagent.put(`${process.env.API_URL}/volunteer/update?subscribe=true`)
              .set('Authorization', `Bearer ${mock.token}`)
              .send(newData);
          })
          .then(response => {
            expect(response.body.userName).toEqual(newData.userName);
            expect(response.body.email).toEqual(newData.email);
            expect(response.body.phoneNumber).toEqual('+17787471078');
            expect(response.body.firstName).toEqual(newData.firstName);
            expect(response.body.lastName).toEqual(newData.lastName);
            expect(response.body.token).toBeTruthy();
            expect(response.status).toEqual(200);
          });
      });

      test('if userName or password is not updated, there should not be a new token', () => {
        return volunteerMockFactory.create()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/volunteer/update`)
              .set('Authorization', `Bearer ${mock.token}`)
              .send({email: faker.internet.email()});
          })
          .then(response => {
            expect(response.body.token).toBeFalsy();
            expect(response.status).toEqual(200);
          });
      });
      
      test('if no valid property is sent, 400 status code is returned', () => {
        return volunteerMockFactory.create()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/volunteer/update`)
              .set('Authorization', `Bearer ${mock.token}`);
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });
      
      test('if an invalid phone number is sent, 400 status code is returned', () => {
        return volunteerMockFactory.create()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/volunteer/update`)
              .set('Authorization', `Bearer ${mock.token}`)
              .send({phoneNumber: 'bad number'});
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });
    });

    describe('PUT /volunteer/apply', () => {
      test('applying to company should respond with a 200 status', () => {
        let mock = null;
        return volunteerMockFactory.createWithCompany()
          .then(mockData => {
            mock = mockData;
            return superagent.put(`${process.env.API_URL}/volunteer/apply`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`)
              .send({
                companyId: mock.company._id,
              });
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.pendingCompanies[0]).toEqual({
              companyId: mock.company._id.toString(),
              companyName: mock.company.companyName,
              phoneNumber: mock.company.phoneNumber,
              email: mock.company.email,
              website: mock.company.website,
            });
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

      test('should return status code 400 if company id is missing', () => {
        return volunteerMockFactory.createWithCompany()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/volunteer/apply`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`);
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });

      test('applying to the same company while still pending should return a 409', () => {
        return volunteerMockFactory.createAndAddPending()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/volunteer/apply`)
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

      test('applying to the same company while active should return a 409', () => {
        return volunteerMockFactory.createAndAddActive()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/volunteer/apply`)
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
            return superagent.put(`${process.env.API_URL}/volunteer/apply`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`)
              .send({
                companyId: '5a51902b21b18802adaa48d6',
              });
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(404);
          });
      });

      test('should respond with a 404 status if you apply to a company with an improperly formatted companyId', () => {
        return volunteerMockFactory.createWithCompany()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/volunteer/apply`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`)
              .send({
                companyId: 'bogus id',
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
            return superagent.put(`${process.env.API_URL}/volunteer/apply`)
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
            return superagent.put(`${process.env.API_URL}/volunteer/apply`)
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
            return superagent.put(`${process.env.API_URL}/volunteer/apply`)
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
            return superagent.put(`${process.env.API_URL}/volunteer/apply`)
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
        return volunteerMockFactory.createAndAddPending()
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
            expect(response.status).toEqual(200);
            expect(response.body.pendingCompanies.length).toEqual(0);
            expect(response.body.activeCompanies.length).toEqual(0);
            return Company.findById(mock.company._id);
          })
          .then(company => {
            expect(company.pendingVolunteers.length).toEqual(0);
            expect(company.activeVolunteers.length).toEqual(0);
          });
      });

      test('should return a 200 if active company is successfully updated', () => {
        let mock = {};
        return volunteerMockFactory.createAndAddActive()
          .then(mockData => {
            mock = mockData;
            expect(mock.company.activeVolunteers[0]).toEqual(mock.volunteer._id);
            expect(mock.volunteer.activeCompanies[0]).toEqual(mock.company._id);
          })
          .then(() => {
            return superagent.put(`${process.env.API_URL}/volunteer/leave`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`)
              .send({
                companyId: mock.company._id,
              });
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.pendingCompanies.length).toEqual(0);
            expect(response.body.activeCompanies.length).toEqual(0);
            return Company.findById(mock.company._id);
          })
          .then(company => {
            expect(company.pendingVolunteers.length).toEqual(0);
            expect(company.activeVolunteers.length).toEqual(0);
          });
      });

      test('should return a 400 if company ID is missing', () => {
        return volunteerMockFactory.createAndAddPending()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/volunteer/leave`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`);
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });

      test('should return a 404 if no company with provided ID is found', () => {
        return volunteerMockFactory.createAndAddPending()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/volunteer/leave`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`)
              .send({
                companyId: '5a4bbf86cf40590014e0734f',
              });
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(404);
          });
      });
    });
  });

  describe('DELETE', () => {
    describe('DELETE /volunteer/delete', () => {
      test('should respond 204 for pendingVolunteers', () => {
        let mock = null;
        return volunteerMockFactory.createAndAddPending()
          .then(mockData => {
            mock = mockData;
            expect(mock.company.pendingVolunteers.length).toBeGreaterThan(0);
            return superagent.delete(`${process.env.API_URL}/volunteer/delete`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`);
          })
          .then(response => {
            expect(response.status).toEqual(204);
            return Company.findById(mock.company._id);
          })
          .then(company => {
            expect(company.pendingVolunteers.length).toEqual(0);
            return Volunteer.findById(mock.volunteer._id);
          })
          .then(volunteer => {
            expect(volunteer).toBeNull();
          });
      });

      test('should respond 204 for activeVolunteers', () => {
        let mock = null;
        return volunteerMockFactory.createAndAddActive()
          .then(mockData => {
            mock = mockData;
            expect(mock.company.activeVolunteers.length).toBeGreaterThan(0);
            return superagent.delete(`${process.env.API_URL}/volunteer/delete`)
              .set('Authorization', `Bearer ${mock.volunteerToken}`);
          })
          .then(response => {
            expect(response.status).toEqual(204);
            return Company.findById(mock.company._id);
          })
          .then(company => {
            expect(company.activeVolunteers.length).toEqual(0);
            return Volunteer.findById(mock.volunteer._id);
          })
          .then(volunteer => {
            expect(volunteer).toBeNull();
          });
      });
    });
  });
});