'use strict';

const faker = require('faker');
const Company = require('../../model/company');

const companyMockFactory = module.exports = {};

companyMockFactory.create = () => {
  let mock = {};
  mock.request = {
    accountName: faker.company.companyName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
  };
  return Company.create(mock.request.accountName, mock.request.password, mock.request.email)
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
