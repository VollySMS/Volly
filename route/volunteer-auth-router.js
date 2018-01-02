'use strict';

const {Router} = require('express');
const jsonParser = require('express').json();
const httpErrors = require('http-errors');
const Volunteer = require('../model/volunteer');
const Company = require('../model/company');
const basicAuthVolunteer = require('../lib/basic-auth-middleware')(Volunteer);
const bearerAuthVolunteer = require('../lib/bearer-auth-middleware')(Volunteer);

const volunteerAuthRouter = module.exports = new Router();

volunteerAuthRouter.post('/volunteer/signup', jsonParser, (request, response, next) => {
  if(!request.body.firstName || !request.body.lastName || !request.body.userName || !request.body.password || !request.body.email || !request.body.phoneNumber) {
    return next(new httpErrors(400, '__ERROR__ <firstName>, <lastName>, <userName>, <email>, <phoneNumber>, and <password> are required to sign up.'));
  }

  return Volunteer.create(request.body.firstName, request.body.lastName, request.body.userName, request.body.password, request.body.email, request.body.phoneNumber)
    .then(volunteer => volunteer.createToken())
    .then(token => response.json({token}))
    .catch(next);
});

volunteerAuthRouter.get('/volunteer/login', basicAuthVolunteer, (request, response, next) => {
  return request.volunteer.createToken()
    .then(token => response.json({token}))
    .catch(next);
});

volunteerAuthRouter.get('/volunteer/opportunities', bearerAuthVolunteer, (request, response, next) => {
  return Company.find({})
    .then(companies => response.json({
      companies: companies.map(company => ({
        companyId: company._id,
        companyName: company.companyName,
        phoneNumber: company.phoneNumber,
        email: company.email,
        website: company.website,      
      })),
    }))
    .catch(next);
});

volunteerAuthRouter.put('/volunteer/apply', bearerAuthVolunteer, jsonParser, (request, response, next) => {
  if(!request.body.companyId)
    return next(new httpErrors(400, '__ERROR__ <companyId> is required to apply.'));

  return Company.findById(request.body.companyId)
    .then(company => {
      for(let volunteer of company.activeVolunteers) {
        if(volunteer.toString() === request.volunteerId.toString()) 
          throw new httpErrors(409, '__ERROR__ duplicate volunteer.');
      }

      for(let volunteer of company.pendingVolunteers) {
        if(volunteer.toString() === request.volunteerId.toString()) {
          throw new httpErrors(409, '__ERROR__ duplicate volunteer.');
        }
      }

      company.pendingVolunteers.push(request.volunteerId);
      return company.save();
    })
    .then(() => Volunteer.findById(request.volunteerId))
    .then(volunteer => {
      volunteer.pendingCompanies.push(request.body.companyId);
      return volunteer.save();
    })
    .then(volunteer => {
      return Volunteer.findById(volunteer._id)
        .populate('pendingCompanies')
        .populate('activeCompanies');
    })
    .then(volunteer => response.json(volunteer.getCensoredCompanies()))
    .catch(next);
});

volunteerAuthRouter.put('/volunteer/leave', bearerAuthVolunteer, jsonParser, (request, response, next) => {
  if(!request.body.companyId)
    return next(new httpErrors(400, '__ERROR__ company id is required'));

  return Company.findById(request.body.companyId)
    .then(company => {
      if(!company)
        throw new httpErrors(404, '__ERROR__ company not found.');

      company.activeVolunteers = company.activeVolunteers.filter(volunteerId => volunteerId.toString() !== request.volunteer._id.toString());
      company.pendingVolunteers = company.pendingVolunteers.filter(volunteerId => volunteerId.toString() !== request.volunteer._id.toString());

      return company.save();
    })
    .then(() => {
      request.volunteer.activeCompanies = request.volunteer.activeCompanies.filter(companyId => companyId.toString() !== request.body.companyId.toString());
      request.volunteer.pendingCompanies = request.volunteer.pendingCompanies.filter(companyId => companyId.toString() !== request.body.companyId.toString());
      return request.volunteer.save();
    })
    .then(volunteer => {
      return Volunteer.findById(volunteer._id)
        .populate('pendingCompanies')
        .populate('activeCompanies');
    })
    .then(volunteer => response.json(volunteer.getCensoredCompanies()))
    .catch(next);
});
