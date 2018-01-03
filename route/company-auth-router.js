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
  if(!request.body.companyName || !request.body.password || !request.body.email || !request.body.phoneNumber || !request.body.website) {
    return next(new httpErrors(400, '__ERROR__ <companyName>, <email>, <phoneNumber>, <website> and <password> are required to sign up.'));
  }

  return Company.create(request.body.companyName, request.body.password, request.body.email, request.body.phoneNumber, request.body.website)
    .then(company => company.createToken())
    .then(token => response.json({token}))
    .catch(next);
});

companyAuthRouter.get('/company/login', basicAuthCompany, (request, response, next) => {
  return request.company.createToken()
    .then(token => response.json({token}))
    .catch(next);
});

companyAuthRouter.get('/company/pending', bearerAuthCompany, (request, response, next) => {
  return Company.findById(request.company._id)
    .populate('pendingVolunteers')
    .then(company => response.json({pendingVolunteers: company.getCensoredVolunteers().pendingVolunteers}))
    .catch(next);
});

companyAuthRouter.get('/company/active', bearerAuthCompany, (request, response, next) => {
  return Company.findById(request.company._id)
    .populate('activeVolunteers')
    .then(company => response.json({activeVolunteers: company.getCensoredVolunteers().activeVolunteers}))
    .catch(next);
});

companyAuthRouter.put('/company/approve', bearerAuthCompany, jsonParser, (request, response, next) => {
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
    .then(company => {
      return Company.findById(company._id)
        .populate('pendingVolunteers')
        .populate('activeVolunteers');        
    })
    .then(company => response.json(company.getCensoredVolunteers()))
    .catch(next);
});

companyAuthRouter.put('/company/terminate', bearerAuthCompany, jsonParser, (request, response, next) => {
  if(!request.body.volunteerId)
    return next(new httpErrors(400, '__ERROR__ volunteer id is required'));

  return Volunteer.findById(request.body.volunteerId)
    .then(volunteer => {
      if(!volunteer)
        throw new httpErrors(404, '__ERROR__ volunteer not found.');

      volunteer.activeCompanies = volunteer.activeCompanies.filter(companyId => companyId.toString() !== request.company._id.toString());
      volunteer.pendingCompanies = volunteer.pendingCompanies.filter(companyId => companyId.toString() !== request.company._id.toString());

      return volunteer.save();
    })
    .then(() => {
      request.company.activeVolunteers = request.company.activeVolunteers.filter(volunteerId => volunteerId.toString() !== request.body.volunteerId.toString());
      request.company.pendingVolunteers = request.company.pendingVolunteers.filter(volunteerId => volunteerId.toString() !== request.body.volunteerId.toString());
      return request.company.save();
    })
    .then(company => {
      return Company.findById(company._id)
        .populate('pendingVolunteers')
        .populate('activeVolunteers');
    })
    .then(company => response.json(company.getCensoredVolunteers()))
    .catch(next);
});