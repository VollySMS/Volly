'use strict';

const faker = require('faker');
const Company = require('../../model/company');

const companyMockFactory = module.exports = {};

// TODO: add companyMockFactory.create()

companyMockFactory.remove = () => Company.remove({});