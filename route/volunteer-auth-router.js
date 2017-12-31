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
  if(!request.body.name || !request.body.userName || !request.body.password || !request.body.email || !request.body.phoneNumber) {
    return next(new httpErrors(400, '__ERROR__ <name>, <userName>, <email>, <phoneNumber>, and <password> are required to sign up.'));
  }

  return Volunteer.create(request.body.name, request.body.userName, request.body.password, request.body.email, request.body.phoneNumber)
    .then(volunteer => volunteer.createToken())
    .then(token => response.json({token}))
    .catch(next);
});

volunteerAuthRouter.post('/volunteer/apply', bearerAuthVolunteer, jsonParser, (request, response, next) => {
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
    .then(() => response.sendStatus(200))
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
