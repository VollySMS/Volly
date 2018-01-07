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
    test('should respond with a 200 and empty response text when volunteer is not in our database', () => {
      return volunteerMockFactory.create(false)
        .then(() => {
          return superagent.post(`${process.env.API_URL}/verify`)
            .send('From=+17787471077&Body=text');
        })
        .then(response => {
          expect(response.text).toEqual('<Response></Response>');
          expect(response.status).toEqual(200);
        });
    });

    test('should respond with a 200 and confirmation message when successfully subscribed', () => {
      return volunteerMockFactory.create()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/verify`)
            .send(`From=${mock.volunteer.phoneNumber}&Body=text`);
        })
        .then(response => {
          expect(response.text).toContain('Volly: Thank you for subscribing. Reply STOP to unsubscribe.');
          expect(response.status).toEqual(200);
        });
    });

    test('should respond with a 200 and no message when successfully unsubscribed', () => {
      return volunteerMockFactory.create()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/verify`)
            .send(`From=${mock.volunteer.phoneNumber}&Body=stop`);
        })
        .then(response => {
          expect(response.text).toEqual('<Response></Response>');
          expect(response.status).toEqual(200);
        });
    });

    test('should respond with a 200 and no message when successfully resubscribed', () => {
      return volunteerMockFactory.create()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/verify`)
            .send(`From=${mock.volunteer.phoneNumber}&Body=start`);
        })
        .then(response => {
          expect(response.text).toEqual('<Response></Response>');
          expect(response.status).toEqual(200);
        });
    });

    test('should respond with a 200 and no message when volunteer is in database but a non-command is sent', () => {
      return volunteerMockFactory.create()
        .then(mock => {
          return superagent.post(`${process.env.API_URL}/verify`)
            .send(`From=${mock.volunteer.phoneNumber}&Body=fakeMessage`);
        })
        .then(response => {
          expect(response.text).toEqual('<Response></Response>');
          expect(response.status).toEqual(200);
        });
    });
  });
});