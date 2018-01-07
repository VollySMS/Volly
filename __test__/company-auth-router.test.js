'use strict';

require('./lib/setup');

const faker = require('faker');
const superagent = require('superagent');

const server = require('../lib/server');
const Company = require('../model/company');
const Volunteer = require('../model/volunteer');
const companyMockFactory = require('./lib/company-mock-factory');
const volunteerMockFactory = require('./lib/volunteer-mock-factory');

const TEXTABLE_NUMBER = '+17787471077';

describe('company-auth-router.js', () => {
  beforeAll(server.start);
  afterAll(server.stop);
  afterEach(volunteerMockFactory.remove);

  describe('POST', () => {
    describe('POST /company/signup', () => {
      test('creating an account should respond with a 200 status and a token', () => {
        return superagent.post(`${process.env.API_URL}/company/signup`)
          .send({
            companyName: faker.company.companyName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
            phoneNumber: TEXTABLE_NUMBER,
            website: faker.internet.url(),
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.token).toBeTruthy();
          });
      });

      test('creating an account should respond with a 400 if an invalid 11 digit phone number is used', () => {
        return superagent.post(`${process.env.API_URL}/company/signup`)
          .send({
            companyName: faker.company.companyName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
            phoneNumber: '+11787471077',
            website: faker.internet.url(),
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });

      test('creating an account should respond with a 400 if an invalid 10 digit phone number is used', () => {
        return superagent.post(`${process.env.API_URL}/company/signup`)
          .send({
            companyName: faker.company.companyName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
            phoneNumber: '1787471077',
            website: faker.internet.url(),
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });

      test('creating an account should respond with a 400 if phone number cannot be coerced into a useable form', () => {
        return superagent.post(`${process.env.API_URL}/company/signup`)
          .send({
            companyName: faker.company.companyName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
            phoneNumber: '+11787471077089',
            website: faker.internet.url(),
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });
  
      test('creating an account should respond with a 400 if an invalid email is sent', () => {
        return superagent.post(`${process.env.API_URL}/company/signup`)
          .send({
            companyName: faker.company.companyName(),
            password: faker.internet.password(),
            email: 'invalid email',
            phoneNumber: TEXTABLE_NUMBER,
            website: faker.internet.url(),
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });
  
      test('creating an account should respond with a 400 if a required field is missing', () => {
        return superagent.post(`${process.env.API_URL}/company/signup`)
          .send({
            password: faker.internet.password(),
            email: faker.internet.email(),
            phoneNumber: TEXTABLE_NUMBER,
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });
  
      test('creating an account should respond with a 400 if an incorrect property type is sent', () => {
        return superagent.post(`${process.env.API_URL}/company/signup`)
          .send({
            companyName: {},
            password: faker.internet.password(),
            email: faker.internet.email(), 
            phoneNumber: TEXTABLE_NUMBER,
            website: faker.internet.url(),
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
                phoneNumber: TEXTABLE_NUMBER,
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
            phoneNumber: TEXTABLE_NUMBER,
            website: faker.internet.url(),
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(404);
          });
      });
    });

    describe('POST /company/send', () => {
      test('should return a 200 once all volunteers are sent a message', () => {
        return volunteerMockFactory.createAndAddPending(true)
          .then(mock => {
            return superagent.post(`${process.env.API_URL}/company/send`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({
                textMessage: faker.random.words(20),
                volunteers: [mock.volunteer._id],
              });
          })
          .then(response => {
            expect(response.status).toEqual(200);
          });
      });

      test('should return a 400 if request data is missing', () => {
        return volunteerMockFactory.createAndAddPending()
          .then(mock => {
            return superagent.post(`${process.env.API_URL}/company/send`)
              .set('Authorization', `Bearer ${mock.companyToken}`);
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });

      test('should return a 400 if request is missing the volunteers array', () => {
        return volunteerMockFactory.createAndAddPending()
          .then(mock => {
            return superagent.post(`${process.env.API_URL}/company/send`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({
                textMessage: faker.random.words(20),
              });
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });

      test('should return a 400 if request array is not of type array', () => {
        return volunteerMockFactory.createAndAddPending()
          .then(mock => {
            return superagent.post(`${process.env.API_URL}/company/send`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({
                textMessage: faker.random.words(20),
                volunteers: mock.volunteer._id,                
              });
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });

      test('should return a 400 if request array is empty', () => {
        return volunteerMockFactory.createAndAddPending()
          .then(mock => {
            return superagent.post(`${process.env.API_URL}/company/send`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({
                textMessage: faker.random.words(20),
                volunteers: [],                
              });
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });

      test('should return a 404 if a volunteer in the array is not in either of the company\'s volunteer arrays', () => {
        return volunteerMockFactory.createAndAddPending()
          .then(mock => {
            return superagent.post(`${process.env.API_URL}/company/send`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({
                textMessage: faker.random.words(20),
                volunteers: ['not a real volunteer'],
              });
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(404);
          });
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
            expect(response.body.token).toBeTruthy();
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
      test('should return a 200 and an array if pending volunteers are successfully found', () => {
        let mock = {};
        return volunteerMockFactory.createAndAddPending()
          .then(mockData => {
            mock = mockData;
            return superagent.get(`${process.env.API_URL}/company/pending`)
              .set('Authorization', `Bearer ${mock.companyToken}`);
          })
          .then(response => {
            expect(response.body.pendingVolunteers[0]).toEqual({
              volunteerId: mock.volunteer._id.toString(),
              firstName: mock.volunteer.firstName,
              lastName: mock.volunteer.lastName,
              phoneNumber: mock.volunteer.phoneNumber,
              email: mock.volunteer.email,
            });
            expect(response.status).toEqual(200);
          });
      });
    });

    describe('GET /company/active', () => {
      test('should return a 200 and an array if active volunteers are successfully found', () => {
        let mock = {};
        return volunteerMockFactory.createAndAddActive()
          .then(mockData => {
            mock = mockData;
            return superagent.get(`${process.env.API_URL}/company/active`)
              .set('Authorization', `Bearer ${mock.companyToken}`);
          })
          .then(response => {
            expect(response.body.activeVolunteers[0]).toEqual({
              volunteerId: mock.volunteer._id.toString(),
              firstName: mock.volunteer.firstName,
              lastName: mock.volunteer.lastName,
              phoneNumber: mock.volunteer.phoneNumber,
              email: mock.volunteer.email,
            });
            expect(response.status).toEqual(200);
          });
      });
    });
  });

  describe('PUT', () => {
    describe('PUT /company/update', () => {
      test('should return object with updated information and new token', () => {
        let newData = null;
        return companyMockFactory.create()
          .then(mock => {
            newData = {
              companyName: faker.company.companyName(),
              password: faker.internet.password(),
              email: faker.internet.email(),
              phoneNumber: '(778) 747-1077',
              website: faker.internet.url(),
            };
            return superagent.put(`${process.env.API_URL}/company/update`)
              .set('Authorization', `Bearer ${mock.token}`)
              .send(newData);
          })
          .then(response => {
            expect(response.body.companyName).toEqual(newData.companyName);
            expect(response.body.email).toEqual(newData.email);
            expect(response.body.phoneNumber).toEqual(TEXTABLE_NUMBER);
            expect(response.body.website).toEqual(newData.website);
            expect(response.body.token).toBeTruthy();
            expect(response.status).toEqual(200);
          });
      });

      test('if companyName or password is not updated, there should not be a new token', () => {
        return companyMockFactory.create()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/company/update`)
              .set('Authorization', `Bearer ${mock.token}`)
              .send({email: faker.internet.email()});
          })
          .then(response => {
            expect(response.body.token).toBeFalsy();
            expect(response.status).toEqual(200);
          });
      });

      test('if an invalid phone number is sent a 400 should be returned', () => {
        return companyMockFactory.create()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/company/update`)
              .set('Authorization', `Bearer ${mock.token}`)
              .send({phoneNumber: 'bad phone'});
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });

      test('if no valid property is sent, 400 status code is returned', () => {
        return companyMockFactory.create()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/company/update`)
              .set('Authorization', `Bearer ${mock.token}`);
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });
    });

    describe('PUT /company/approve', () => {
      test('TEXTABLE - should return object with active and pending volunteers arrays', () => {
        let mock = {};
        return volunteerMockFactory.createAndAddPending(true)
          .then(mockData => {
            mock = mockData;
            return superagent.put(`${process.env.API_URL}/company/approve`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({volunteerId: mock.volunteer._id});
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.activeVolunteers[0]).toEqual({
              volunteerId: mock.volunteer._id.toString(),
              firstName: mock.volunteer.firstName,
              lastName: mock.volunteer.lastName,
              phoneNumber: mock.volunteer.phoneNumber,
              email: mock.volunteer.email,
            });
            expect(response.body.pendingVolunteers.length).toEqual(0);
            return Volunteer.findById(mock.volunteer._id);
          })
          .then(volunteer => {
            expect(volunteer.pendingCompanies.length).toEqual(0);
            expect(volunteer.activeCompanies[0]).toEqual(mock.company._id);
          });
      });

      test('NON_TEXTABLE - should return object with active and pending volunteers arrays', () => {
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
            expect(response.body.activeVolunteers[0]).toEqual({
              volunteerId: mock.volunteer._id.toString(),
              firstName: mock.volunteer.firstName,
              lastName: mock.volunteer.lastName,
              phoneNumber: mock.volunteer.phoneNumber,
              email: mock.volunteer.email,
            });
            expect(response.body.pendingVolunteers.length).toEqual(0);
            return Volunteer.findById(mock.volunteer._id);
          })
          .then(volunteer => {
            expect(volunteer.pendingCompanies.length).toEqual(0);
            expect(volunteer.activeCompanies[0]).toEqual(mock.company._id);
          });
      });

      test('should return 404 if the volunteer does not exist in pending', () => {
        return companyMockFactory.create()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/company/approve`)
              .set('Authorization', `Bearer ${mock.token}`)
              .send({volunteerId: '5a4bc01dcf40590014e07351'});
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(404);
          });
      });
      
      test('should return 400 if no volunteerId is sent', () => {
        return companyMockFactory.create()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/company/approve`)
              .set('Authorization', `Bearer ${mock.token}`);
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });
    });

    describe('PUT /company/terminate', () => {
      test('NON_TEXTABLE - should return a 200 if pending volunteer is successfully terminated', () => {
        let mock = {};
        return volunteerMockFactory.createAndAddPending()
          .then(mockData => {
            mock = mockData;
            expect(mock.company.pendingVolunteers[0].toString()).toEqual(mock.volunteer._id.toString());
            expect(mock.volunteer.pendingCompanies[0].toString()).toEqual(mock.company._id.toString());
          })
          .then(() => {
            return superagent.put(`${process.env.API_URL}/company/terminate`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({
                volunteerId: mock.volunteer._id,
              });
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.pendingVolunteers.length).toEqual(0);
            expect(response.body.activeVolunteers.length).toEqual(0);
            return Volunteer.findById(mock.volunteer._id);
          })
          .then(volunteer => {
            expect(volunteer.pendingCompanies.length).toEqual(0);
            expect(volunteer.activeCompanies.length).toEqual(0);
          });
      });

      test('TEXTABLE - should return a 200 if pending volunteer is successfully terminated', () => {
        let mock = {};
        return volunteerMockFactory.createAndAddPending(true)
          .then(mockData => {
            mock = mockData;
            expect(mock.company.pendingVolunteers[0].toString()).toEqual(mock.volunteer._id.toString());
            expect(mock.volunteer.pendingCompanies[0].toString()).toEqual(mock.company._id.toString());
          })
          .then(() => {
            return superagent.put(`${process.env.API_URL}/company/terminate`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({
                volunteerId: mock.volunteer._id,
              });
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.pendingVolunteers.length).toEqual(0);
            expect(response.body.activeVolunteers.length).toEqual(0);
            return Volunteer.findById(mock.volunteer._id);
          })
          .then(volunteer => {
            expect(volunteer.pendingCompanies.length).toEqual(0);
            expect(volunteer.activeCompanies.length).toEqual(0);
          });
      });

      test('NON_TEXTABLE - should return a 200 if active volunteer is successfully terminated', () => {
        let mock = {};
        return volunteerMockFactory.createAndAddActive()
          .then(mockData => {
            mock = mockData;
            expect(mock.company.activeVolunteers[0]).toEqual(mock.volunteer._id);
            expect(mock.volunteer.activeCompanies[0]).toEqual(mock.company._id);
          })
          .then(() => {
            return superagent.put(`${process.env.API_URL}/company/terminate`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({
                volunteerId: mock.volunteer._id,
              });
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.pendingVolunteers.length).toEqual(0);
            expect(response.body.activeVolunteers.length).toEqual(0);
            return Volunteer.findById(mock.volunteer._id);
          })
          .then(volunteer => {
            expect(volunteer.pendingCompanies.length).toEqual(0);
            expect(volunteer.activeCompanies.length).toEqual(0);
          });
      });

      test('TEXTABLE - should return a 200 if active volunteer is successfully terminated', () => {
        let mock = {};
        return volunteerMockFactory.createAndAddActive(true)
          .then(mockData => {
            mock = mockData;
            expect(mock.company.activeVolunteers[0]).toEqual(mock.volunteer._id);
            expect(mock.volunteer.activeCompanies[0]).toEqual(mock.company._id);
          })
          .then(() => {
            return superagent.put(`${process.env.API_URL}/company/terminate`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({
                volunteerId: mock.volunteer._id,
              });
          })
          .then(response => {
            expect(response.status).toEqual(200);
            expect(response.body.pendingVolunteers.length).toEqual(0);
            expect(response.body.activeVolunteers.length).toEqual(0);
            return Volunteer.findById(mock.volunteer._id);
          })
          .then(volunteer => {
            expect(volunteer.pendingCompanies.length).toEqual(0);
            expect(volunteer.activeCompanies.length).toEqual(0);
          });
      });

      test('should return a 400 if volunteer ID is missing', () => {
        return volunteerMockFactory.createAndAddPending()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/company/terminate`)
              .set('Authorization', `Bearer ${mock.companyToken}`);
          })
          .then(Promise.reject)
          .catch(response => {
            expect(response.status).toEqual(400);
          });
      });

      test('should return a 404 if no volunteer with provided ID is found', () => {
        return volunteerMockFactory.createAndAddPending()
          .then(mock => {
            return superagent.put(`${process.env.API_URL}/company/terminate`)
              .set('Authorization', `Bearer ${mock.companyToken}`)
              .send({
                volunteerId: '5a493e9d1bc2c881baf35d85',
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
    describe('DELETE /company/delete', () => {
      test('should respond 204 for pendingCompanies', () => {
        let mock = null;
        return volunteerMockFactory.createAndAddPending()
          .then(mockData => {
            mock = mockData;
            expect(mock.volunteer.pendingCompanies.length).toBeGreaterThan(0);
            return superagent.delete(`${process.env.API_URL}/company/delete`)
              .set('Authorization', `Bearer ${mock.companyToken}`);
          })
          .then(response => {
            expect(response.status).toEqual(204);
            return Volunteer.findById(mock.volunteer._id);
          })
          .then(volunteer => {
            expect(volunteer.pendingCompanies.length).toEqual(0);
            return Company.findById(mock.company._id);
          })
          .then(company => {
            expect(company).toBeNull();
          });
      });

      test('should respond 204 for activeCompanies', () => {
        let mock = null;
        return volunteerMockFactory.createAndAddActive()
          .then(mockData => {
            mock = mockData;
            expect(mock.volunteer.activeCompanies.length).toBeGreaterThan(0);
            return superagent.delete(`${process.env.API_URL}/company/delete`)
              .set('Authorization', `Bearer ${mock.companyToken}`);
          })
          .then(response => {
            expect(response.status).toEqual(204);
            return Volunteer.findById(mock.volunteer._id);
          })
          .then(volunteer => {
            expect(volunteer.activeCompanies.length).toEqual(0);
            return Company.findById(mock.company._id);
          })
          .then(company => {
            expect(company).toBeNull();
          });
      });
    });
  });

  describe('__INTERNAL_SERVER_ERROR__', () => {
    test('should return a 500 if some anomalous error occurs.', () => {
      delete process.env.SALT_SECRET;
      return superagent.post(`${process.env.API_URL}/company/signup`)
        .send({
          companyName: faker.company.companyName(),          
          password: faker.internet.password(),
          email: faker.internet.email(), 
          phoneNumber: TEXTABLE_NUMBER,
          website: faker.internet.url(),
        })
        .then(Promise.reject)
        .catch(response => {
          expect(response.status).toEqual(500);
        });
    });
  });
});