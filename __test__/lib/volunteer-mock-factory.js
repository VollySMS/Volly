'use strict';

const faker = require('faker');
const Volunteer = require('../../model/volunteer');
const companyMockFactory = require('./company-mock-factory');

const volunteerMockFactory = module.exports = {};

volunteerMockFactory.create = () => {
  let mock = {};
  mock.request = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    userName: faker.company.companyName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    phoneNumber: faker.phone.phoneNumber(),
  };
  return Volunteer.create(mock.request.firstName, mock.request.lastName, mock.request.userName, mock.request.password, mock.request.email, mock.request.phoneNumber)
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

volunteerMockFactory.createWithCompany = () => {
  let mock = {};
  return companyMockFactory.create()
    .then(company => {
      mock.company = company.company;
      mock.companyToken = company.token;
      return volunteerMockFactory.create();
    })
    .then(volunteer => {
      mock.volunteer = volunteer.volunteer;
      mock.volunteerToken = volunteer.token;
      return mock;
    })
    .catch(console.log);
};

volunteerMockFactory.createAndAddPending = () => {
  let mock = {};
  return volunteerMockFactory.createWithCompany()
    .then(mockData => {
      mock = mockData;

      mock.company.pendingVolunteers.push(mock.volunteer._id);
      return mock.company.save();
    })
    .then(() => {
      mock.volunteer.pendingCompanies.push(mock.company._id);
      return mock.volunteer.save();
    })
    .then(() => mock)
    .catch(console.log);
};

volunteerMockFactory.createAndAddActive = () => {
  let mock = {};
  return volunteerMockFactory.createAndAddPending()
    .then(mockData => {
      mock = mockData;

      mock.company.pendingVolunteers = [];
      mock.company.activeVolunteers.push(mock.volunteer._id);
      return mock.company.save();
    })
    .then(() => {
      mock.volunteer.pendingCompanies = [];
      mock.volunteer.activeCompanies.push(mock.company._id);
      return mock.volunteer.save();
    })
    .then(() => mock)
    .catch(console.log);
};

volunteerMockFactory.remove = () => {
  return Promise.all([
    companyMockFactory.remove(),
    Volunteer.remove({}),
  ]);
};
