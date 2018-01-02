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
  if(!request.volunteer) {
    return next(new httpErrors(404, '__ERROR__ volunteer not found'));
  }
  
  return request.volunteer.createToken()
    .then(token => response.json({token}))
    .catch(next);
});

// TODO: Add a GET route to get an array of all companies that they could apply for.

volunteerAuthRouter.put('/volunteer/apply', bearerAuthVolunteer, jsonParser, (request, response, next) => {
  if(!request.body.companyId)
    return next(new httpErrors(400, '__ERROR__ <companyId> is required to apply.'));

  return Company.findById(request.body.companyId)
    .then(company => {
      if(!company)
        throw new httpErrors(404, '__ERROR__ company not found.');

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
      if(!volunteer)
        throw new httpErrors(404, '__ERROR__ volunteer not found.');
      volunteer.pendingCompanies.push(request.body.companyId);
      return volunteer.save();
    })
    .then(() => response.sendStatus(200)) // TODO: send back arrays instead
    .catch(next);

});

volunteerAuthRouter.put('/volunteer/leave', bearerAuthVolunteer, jsonParser, (request, response, next) => {
  if(!request.volunteer) {
    return next(new httpErrors(404, '__ERROR__ volunteer not found'));
  }

  if(!request.body.companyId){
    return next(new httpErrors(400, '__ERROR__ company id is required'));
  }

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
    .then(volunteer => response.json({volunteer})) // TODO: don't send the entire volunteer back, just send back the arrays (with detailed info about the company)
    .catch(next);
});
