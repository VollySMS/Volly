'use strict';

const {Router} = require('express');
const jsonParser = require('express').json();
const Volunteer = require('../model/volunteer');
const httpErrors = require('http-errors');
const basicAuthVolunteer = require('../lib/basic-auth-middleware')(Volunteer);

const volunteerAuthRouter = module.exports = new Router();

volunteerAuthRouter.post('/volunteer-signup', jsonParser, (request, response, next) => {
  if(!request.body.name || !request.body.userName || !request.body.password || !request.body.email || !request.body.phoneNumber) {
    return next(new httpErrors(400, '__ERROR__ <name>, <userName>, <email>, <phoneNumber>, and <password> are required to sign up.'));
  }

  return Volunteer.create(request.body.name, request.body.userName, request.body.password, request.body.email, request.body.phoneNumber)
    .then(volunteer => volunteer.createToken())
    .then(token => response.json({token}))
    .catch(next);
});

volunteerAuthRouter.get('/volunteer-login', basicAuthVolunteer, (request, response, next) => {
  if(!request.volunteer) {
    return next(new httpErrors(404, '__ERROR__ volunteer not found'));
  }

  return request.volunteer.createToken()
    .then(token => response.json({token}))
    .catch(next);
});
