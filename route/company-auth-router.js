'use strict';

const {Router} = require('express');
const jsonParser = require('express').json();
const Company = require('../model/company');
const httpErrors = require('http-errors');
const basicAuthCompany = require('../lib/basic-auth-middleware')(Company);

const companyAuthRouter = module.exports = new Router();

companyAuthRouter.post('/company-signup', jsonParser, (request, response, next) => {
  if(!request.body.companyName || !request.body.password || !request.body.email) {
    return next(new httpErrors(400, '__ERROR__ <companyName>, <email>, and <password> are required to sign up.'));
  }

  return Company.create(request.body.companyName, request.body.password, request.body.email)
    .then(company => company.createToken())
    .then(token => response.json({token}))
    .catch(next);
});

companyAuthRouter.get('/company-login', basicAuthCompany, (request, response, next) => {
  if(!request.company) {
    return next(new httpErrors(400, '__ERROR__ company not found'));
  }

  return request.company.createToken()
    .then(token => response.json({token}))
    .catch(next);
});
