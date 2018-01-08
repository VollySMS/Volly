'use strict';

const {Router} = require('express');
const jsonParser = require('express').json();
const httpErrors = require('http-errors');

const Volunteer = require('../model/volunteer');
const Company = require('../model/company');
const phoneNumber = require('../lib/phone-number');
const basicAuthVolunteer = require('../lib/basic-auth-middleware')(Volunteer);
const bearerAuthVolunteer = require('../lib/bearer-auth-middleware')(Volunteer);

const volunteerAuthRouter = module.exports = new Router();

volunteerAuthRouter.post('/volunteer/signup', jsonParser, (request, response, next) => {
  if(!request.body.firstName || !request.body.lastName || !request.body.userName || !request.body.password || !request.body.email || !request.body.phoneNumber)
    return next(new httpErrors(400, '__ERROR__ <firstName>, <lastName>, <userName>, <email>, <phoneNumber>, and <password> are required to sign up.'));

  if(!(/^.+@.+\..+$/).test(request.body.email))
    return next(new httpErrors(400, '__ERROR__ invalid email'));

  let formattedPhoneNumber = phoneNumber.verifyPhoneNumber(request.body.phoneNumber);

  if(!formattedPhoneNumber)
    return next(new httpErrors(400, '__ERROR__ invalid phone number'));

  return Volunteer.create(request.body.firstName, request.body.lastName, request.body.userName, request.body.password, request.body.email, formattedPhoneNumber)
    .then(volunteer => {
      request.volunteer = volunteer;
      return volunteer.createToken();
    })
    .then(token => {
      request.token = token;
      if(request.query.subscribe === 'true')
        return request.volunteer.initiateValidation();

      return null;
    })
    .then(() => response.json({token: request.token}))
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

volunteerAuthRouter.get('/volunteer/pending', bearerAuthVolunteer, (request, response, next) => {
  return Volunteer.findById(request.volunteer._id)
    .populate('pendingCompanies')
    .then(volunteer => response.json({pendingCompanies: volunteer.getCensoredPendingCompanies()}))
    .catch(next);
});

volunteerAuthRouter.get('/volunteer/active', bearerAuthVolunteer, (request, response, next) => {
  return Volunteer.findById(request.volunteer._id)
    .populate('activeCompanies')
    .then(volunteer => response.json({activeCompanies: volunteer.getCensoredActiveCompanies()}))
    .catch(next);
});

volunteerAuthRouter.put('/volunteer/update', bearerAuthVolunteer, jsonParser, (request, response, next) => {
  if(!(request.body.userName || request.body.password || request.body.email || request.body.phoneNumber || request.body.firstName || request.body.lastName))
    return next(new httpErrors(400, '__ERROR__ <userName>, <email>, <phoneNumber>, <firstName>, <lastName> or <password> are required to update volunteer info'));
  
  if(request.body.phoneNumber) {
    let formattedPhoneNumber = phoneNumber.verifyPhoneNumber(request.body.phoneNumber);
  
    if(!formattedPhoneNumber || formattedPhoneNumber === request.volunteer.phoneNumber)
      return next(new httpErrors(400, '__ERROR__ invalid phone number'));
    
    request.body.phoneNumber = formattedPhoneNumber;
    request.volunteer.textable = false;
    request.volunteer.firstSubscribe = true;
  }
  
  let data = {};
  for(let prop of Object.keys(request.body)){
    if(request.volunteer[prop])
      request.volunteer[prop] = request.body[prop];
  }

  return request.volunteer.save()
    .then(volunteer => request.body.password ? request.volunteer.changePassword(request.body.password) : volunteer)
    .then(volunteer => {
      data.userName = volunteer.userName;
      data.email = volunteer.email;
      data.phoneNumber = volunteer.phoneNumber;
      data.firstName = volunteer.firstName;
      data.lastName = volunteer.lastName;
      request.volunteer = volunteer;

      return request.body.userName || request.body.password ? volunteer.createToken() : null;
    })
    .then(token => {
      if(token)
        data.token = token;

      if(request.body.phoneNumber && request.query.subscribe === 'true')
        return request.volunteer.initiateValidation();
        
      return null;
    })
    .then(() => response.json(data))
    .catch(next);
});

volunteerAuthRouter.put('/volunteer/apply', bearerAuthVolunteer, jsonParser, (request, response, next) => {
  if(!request.body.companyId)
    return next(new httpErrors(400, '__ERROR__ <companyId> is required to apply.'));

  return Company.findById(request.body.companyId)
    .then(company => {
      if(!company)
        throw new httpErrors(404, '__ERROR__ company not found.');

      let currentVolunteers = {};
      company.activeVolunteers.forEach(volunteerId => currentVolunteers[volunteerId.toString()] = true);
      company.pendingVolunteers.forEach(volunteerId => currentVolunteers[volunteerId.toString()] = true);

      if(currentVolunteers[request.volunteer._id.toString()])
        throw new httpErrors(409, '__ERROR__ already applied to company');

      company.pendingVolunteers.push(request.volunteer._id);
      return company.save();
    })
    .then(() => {
      request.volunteer.pendingCompanies.push(request.body.companyId);
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

volunteerAuthRouter.put('/volunteer/leave', bearerAuthVolunteer, jsonParser, (request, response, next) => {
  if(!request.body.companyId)
    return next(new httpErrors(400, '__ERROR__ company id is required'));

  let activeCompanies = {};
  request.volunteer.activeCompanies.forEach(companyId => activeCompanies[companyId.toString()] = true);

  let volunteerType = activeCompanies[request.body.companyId.toString()] ? 'active' : 'pending';

  return Company.findById(request.body.companyId)
    .then(company => {
      if(!company)
        throw new httpErrors(404, '__ERROR__ company not found.');

      company[`${volunteerType}Volunteers`] = company[`${volunteerType}Volunteers`].filter(volunteerId => volunteerId.toString() !== request.volunteer._id.toString());

      return company.save();
    })
    .then(() => {
      request.volunteer[`${volunteerType}Companies`] = request.volunteer[`${volunteerType}Companies`].filter(companyId => companyId.toString() !== request.body.companyId.toString());
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

volunteerAuthRouter.delete('/volunteer/delete', bearerAuthVolunteer, (request, response, next) => {
  let data = {};
  return Volunteer.findById(request.volunteer._id)
    .populate('pendingCompanies')
    .populate('activeCompanies')
    .then(volunteer => {
      data.pending = volunteer.pendingCompanies;
      data.active = volunteer.activeCompanies;

      return Promise.all(data.pending.map(company => {
        company.pendingVolunteers = company.pendingVolunteers.filter(volunteerId => volunteerId.toString() !== request.volunteer._id.toString());
        return company.save();
      }));
    })
    .then(() => {
      return Promise.all(data.active.map(company => {
        company.activeVolunteers = company.activeVolunteers.filter(volunteerId => volunteerId.toString() !== request.volunteer._id.toString());
        return company.save();
      }));
    })
    .then(() => Volunteer.findByIdAndRemove(request.volunteer._id))
    .then(() => response.sendStatus(204))
    .catch(next);
});