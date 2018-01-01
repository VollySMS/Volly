'use strict';

const {Router} = require('express');
const jsonParser = require('express').json();
const httpErrors = require('http-errors');
const Company = require('../model/company');
const Volunteer = require('../model/volunteer');
const basicAuthCompany = require('../lib/basic-auth-middleware')(Company);
const bearerAuthCompany = require('../lib/bearer-auth-middleware')(Company);

const companyAuthRouter = module.exports = new Router();

companyAuthRouter.post('/company/signup', jsonParser, (request, response, next) => {
  if(!request.body.companyName || !request.body.password || !request.body.email || !request.body.phoneNumber) {
    return next(new httpErrors(400, '__ERROR__ <companyName>, <email>, <phoneNumber> and <password> are required to sign up.'));
  }

  return Company.create(request.body.companyName, request.body.password, request.body.email, request.body.phoneNumber)
    .then(company => company.createToken())
    .then(token => response.json({token}))
    .catch(next);
});

companyAuthRouter.get('/company/login', basicAuthCompany, (request, response, next) => {
  if(!request.company) 
    return next(new httpErrors(404, '__ERROR__ company not found'));

  return request.company.createToken()
    .then(token => response.json({token}))
    .catch(next);
});

companyAuthRouter.get('/company/pending', bearerAuthCompany, (request, response, next) => {
  if(!request.company) 
    return next(new httpErrors(404, '__ERROR__ company not found'));

  return response.json({pendingVolunteers: request.company.pendingVolunteers});
});

companyAuthRouter.put('/company/approve', bearerAuthCompany, jsonParser, (request, response, next) => {
  if(!request.company) 
    return next(new httpErrors(404, '__ERROR__ company not found'));

  return Volunteer.findById(request.body.volunteerId)
    .then(volunteer => {
      if(!volunteer) 
        throw new httpErrors(404, '__ERROR__ volunteer not found');
      
      volunteer.activeCompanies.push(request.company._id);
      volunteer.pendingCompanies = volunteer.pendingCompanies.filter(companyId => companyId.toString() !== request.company._id.toString());
      return volunteer.save();        
    })
    .then(volunteer => {
      request.company.activeVolunteers.push(volunteer._id);
      request.company.pendingVolunteers = request.company.pendingVolunteers.filter(volunteerId => volunteerId.toString() !== volunteer._id.toString());
      return request.company.save();
    })
    .then(company => response.json({pendingVolunteers: company.pendingVolunteers, activeVolunteers: company.activeVolunteers}))
    .catch(next);
});
