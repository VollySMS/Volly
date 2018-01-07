'use strict';

const faker = require('faker');

const Volunteer = require('../../model/volunteer');
const companyMockFactory = require('./company-mock-factory');

const volunteerMockFactory = module.exports = {};

const TEXTABLE_NUMBER = '+17787471077';
const NOT_TEXTABLE_NUMBER = '+12538042550';

volunteerMockFactory.create = (textable = false) => {
  let mock = {};
  mock.request = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    userName: faker.company.companyName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    phoneNumber: textable ? TEXTABLE_NUMBER : NOT_TEXTABLE_NUMBER, 
  };

  return Volunteer.create(mock.request.firstName, mock.request.lastName, mock.request.userName, mock.request.password, mock.request.email, mock.request.phoneNumber, textable)
    .then(volunteer => {
      mock.volunteer = volunteer;
      return volunteer.createToken();
    })
    .then(token => {
      mock.token = token;
      return Volunteer.findById(mock.volunteer._id);
    })
    .then(volunteer => {
      mock.volunteer = volunteer;
      return mock;
    })
    .catch(console.log);
};

volunteerMockFactory.createWithCompany = (textable = false) => {
  let mock = {};
  return companyMockFactory.create()
    .then(companyMock => {
      mock.company = companyMock.company;
      mock.companyToken = companyMock.token;
      return volunteerMockFactory.create(textable);
    })
    .then(volunteer => {
      mock.volunteer = volunteer.volunteer;
      mock.volunteerToken = volunteer.token;
      return mock;
    })
    .catch(console.log);
};

volunteerMockFactory.createAndAddPending = (textable = false) => {
  let mock = {};
  return volunteerMockFactory.createWithCompany(textable)
    .then(mockData => {
      mock = mockData;

      mock.company.pendingVolunteers.push(mock.volunteer._id);
      return mock.company.save();
    })
    .then(company => {
      mock.company = company;
      mock.volunteer.pendingCompanies.push(company._id);
      return mock.volunteer.save();
    })
    .then(volunteer => {
      mock.volunteer = volunteer;
      return mock;
    })
    .catch(console.log);
};

volunteerMockFactory.createAndAddActive = (textable = false) => {
  let mock = {};
  return volunteerMockFactory.createAndAddPending(textable)
    .then(mockData => {
      mock = mockData;

      mock.company.pendingVolunteers = [];
      mock.company.activeVolunteers.push(mock.volunteer._id);
      return mock.company.save();
    })
    .then(company => {
      mock.company = company;
      mock.volunteer.pendingCompanies = [];
      mock.volunteer.activeCompanies.push(company._id);
      return mock.volunteer.save();
    })
    .then(volunteer => {
      mock.volunteer = volunteer;
      return mock;
    })
    .catch(console.log);
};

volunteerMockFactory.remove = () => {
  return Promise.all([
    companyMockFactory.remove(),
    Volunteer.remove({}),
  ]);
};
