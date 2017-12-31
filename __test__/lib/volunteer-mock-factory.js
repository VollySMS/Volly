'use strict';

const faker = require('faker');
const Volunteer = require('../../model/volunteer');

const volunteerMockFactory = module.exports = {};

volunteerMockFactory.create = () => {
  let mock = {};
  mock.request = {
    name: faker.name.firstName() + faker.name.lastName(),
    userName: faker.company.companyName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
  };
  return Volunteer.create(mock.request.name, mock.request.userName, mock.request.password, mock.request.email)
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

volunteerMockFactory.remove = () => Volunteer.remove({});
