'use strict';

const faker = require('faker');

const Company = require('../../model/company');

const companyMockFactory = module.exports = {};

companyMockFactory.create = () => {
  let mock = {};
  mock.request = {
    companyName: faker.company.companyName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    phoneNumber: '+17787471077',
    website: faker.internet.url(),
  };
  
  return Company.create(mock.request.companyName, mock.request.password, mock.request.email, mock.request.phoneNumber, mock.request.website)
    .then(company => {
      mock.company = company;
      return company.createToken();
    })
    .then(token => {
      mock.token = token;
      return Company.findById(mock.company._id);
    })
    .then(company => {
      mock.company = company;
      return mock;
    })
    .catch(console.log);
};

companyMockFactory.remove = () => Company.remove({});
