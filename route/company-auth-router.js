'use strict';

const {Router} = require('express');
const jsonParser = require('express').json();
const httpErrors = require('http-errors');
const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const logger = require('../lib/logger');
const Company = require('../model/company');
const Volunteer = require('../model/volunteer');
const phoneNumber = require('../lib/phone-number');
const basicAuthCompany = require('../lib/basic-auth-middleware')(Company);
const bearerAuthCompany = require('../lib/bearer-auth-middleware')(Company);

const companyAuthRouter = module.exports = new Router();

companyAuthRouter.post('/company/signup', jsonParser, (request, response, next) => {
  if(!request.body.companyName || !request.body.password || !request.body.email || !request.body.phoneNumber || !request.body.website)
    return next(new httpErrors(400, '__ERROR__ <companyName>, <email>, <phoneNumber>, <website> and <password> are required to sign up.'));

  if(!(/^.+@.+\..+$/).test(request.body.email))
    return next(new httpErrors(400, '__ERROR__ invalid email'));

  let formattedPhoneNumber = phoneNumber.verifyPhoneNumber(request.body.phoneNumber);

  if(!formattedPhoneNumber)
    return next(new httpErrors(400, '__ERROR__ invalid phone number'));

  return Company.create(request.body.companyName, request.body.password, request.body.email, formattedPhoneNumber, request.body.website)
    .then(company => company.createToken())
    .then(token => response.json({token}))
    .catch(next);
});

companyAuthRouter.post('/company/send', bearerAuthCompany, jsonParser, (request, response, next) => {
  if(!request.body.textMessage || !request.body.volunteers || !Array.isArray(request.body.volunteers) || !request.body.volunteers.length)
    return next(new httpErrors(400, '__ERROR__ <textMessage> and <volunteers> (array) are required, and volunteers must not be empty.'));

  let volunteers = {};
  request.company.pendingVolunteers.concat(request.company.activeVolunteers)
    .forEach(volunteerId => volunteers[volunteerId.toString()] = true);

  for(let volunteerId of request.body.volunteers) {
    if(!volunteers[volunteerId.toString()])
      return next(new httpErrors(404, `${volunteerId} not in company`));
  }

  return Promise.all(request.body.volunteers.map(volunteerId => Volunteer.findById(volunteerId)))
    .then(volunteers => volunteers.filter(volunteer => volunteer.textable))
    .then(volunteers => Promise.all(volunteers.map(volunteer => client.messages.create({
      to: volunteer.phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: request.body.textMessage,
    }))))
    .then(() => response.sendStatus(200))
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
    .then(company => response.json({pendingVolunteers: company.getCensoredPendingVolunteers()}))
    .catch(next);
});

companyAuthRouter.get('/company/active', bearerAuthCompany, (request, response, next) => {
  return Company.findById(request.company._id)
    .populate('activeVolunteers')
    .then(company => response.json({activeVolunteers: company.getCensoredActiveVolunteers()}))
    .catch(next);
});

companyAuthRouter.put('/company/update', bearerAuthCompany, jsonParser, (request, response, next) => {
  if(!(request.body.companyName || request.body.password || request.body.email || request.body.phoneNumber || request.body.website))
    return next(new httpErrors(400, '__ERROR__ <companyName>, <email>, <phoneNumber>, <website> or <password> are required to update company info'));

  if(request.body.phoneNumber) {
    let formattedPhoneNumber = phoneNumber.verifyPhoneNumber(request.body.phoneNumber);
  
    if(!formattedPhoneNumber)
      return next(new httpErrors(400, '__ERROR__ invalid phone number'));
    
    request.body.phoneNumber = formattedPhoneNumber;
  }

  let data = {};
  for(let prop of Object.keys(request.body)){
    if(request.company[prop])
      request.company[prop] = request.body[prop];
  }

  return request.company.save()
    .then(company => request.body.password ? request.company.changePassword(request.body.password) : company)
    .then(company => {
      data.companyName = company.companyName;
      data.email = company.email;
      data.phoneNumber = company.phoneNumber;
      data.website = company.website;

      return request.body.companyName || request.body.password ? company.createToken() : null;
    })
    .then(token => {
      if(token)
        data.token = token;
      return response.json(data);
    })
    .catch(next);
});

companyAuthRouter.put('/company/approve', bearerAuthCompany, jsonParser, (request, response, next) => {
  if(!request.body.volunteerId)
    return next(new httpErrors(400, '<volunteerId> is required.'));

  let pendingVolunteers = {};
  request.company.pendingVolunteers.forEach(pendingVolunteerId => pendingVolunteers[pendingVolunteerId.toString()] = true);

  if(!pendingVolunteers[request.body.volunteerId])
    return next(new httpErrors(404, '__ERROR__ volunteer does not exist in pending volunteers'));

  return Volunteer.findById(request.body.volunteerId)
    .then(volunteer => {
      request.body.volunteerFirstName = volunteer.firstName;
      volunteer.activeCompanies.push(request.company._id);
      volunteer.pendingCompanies = volunteer.pendingCompanies.filter(companyId => companyId.toString() !== request.company._id.toString());
      return volunteer.save();
    })
    .then(volunteer => {
      request.volunteer = volunteer;
      request.company.activeVolunteers.push(volunteer._id);
      request.company.pendingVolunteers = request.company.pendingVolunteers.filter(volunteerId => volunteerId.toString() !== volunteer._id.toString());
      return request.company.save();
    })
    .then(company => {
      request.companyId = company._id;

      if(request.volunteer.textable){
        return client.messages.create({
          to: request.volunteer.phoneNumber,
          from: process.env.TWILIO_PHONE_NUMBER,
          body: `Congratulations ${request.body.volunteerFirstName}, you've been accepted as a volunteer by ${company.companyName}!`,
        });
      }

      return null;
    })
    .then(message => {      
      logger.info('approved:' + (message ? `${message.sid}: message sent to ${request.volunteer.phoneNumber}` : 'volunteer not textable'));
      return Company.findById(request.companyId)
        .populate('pendingVolunteers')
        .populate('activeVolunteers');
    })
    .then(company => response.json(company.getCensoredVolunteers()))
    .catch(next);
});

companyAuthRouter.put('/company/terminate', bearerAuthCompany, jsonParser, (request, response, next) => {
  if(!request.body.volunteerId)
    return next(new httpErrors(400, '__ERROR__ volunteer id is required'));

  let pendingVolunteers = {}, activeVolunteers = {};
  let volunteerId = request.body.volunteerId.toString();
  
  request.company.activeVolunteers
    .forEach(volunteerId => activeVolunteers[volunteerId.toString()] = true);
  
  request.company.pendingVolunteers
    .forEach(volunteerId => pendingVolunteers[volunteerId.toString()] = true);

  if(!(activeVolunteers[volunteerId] || pendingVolunteers[volunteerId]))
    throw new httpErrors(404, '__ERROR__ volunteer not found.');

  let volunteerType = activeVolunteers[volunteerId] ? 'active' : 'pending';

  return Volunteer.findById(request.body.volunteerId)
    .then(volunteer => {
      request.volunteer = volunteer;
      volunteer[`${volunteerType}Companies`] = volunteer[`${volunteerType}Companies`].filter(companyId => companyId.toString() !== request.company._id.toString());

      return volunteer.save();
    })
    .then(() => {
      request.company[`${volunteerType}Volunteers`] = request.company[`${volunteerType}Volunteers`].filter(volunteerId => volunteerId.toString() !== request.body.volunteerId.toString());

      return request.company.save();
    })
    .then(() => {
      if(request.volunteer.textable) {
        return client.messages.create({
          to: request.volunteer.phoneNumber,
          from: process.env.TWILIO_PHONE_NUMBER,
          body: volunteerType === 'pending' ? `Thank you for your interest in ${request.company.companyName}. At this time we have decided to pursue other candidates.` : `Thank you for supporting ${request.company.companyName}. You have been removed from our volunteer list.`,
        });
      }

      return null;
    })
    .then(message => {
      logger.info('terminated:' + (message ? `message sent to ${request.volunteer.phoneNumber}` : 'volunteer not textable'));
      return Company.findById(request.company._id)
        .populate('pendingVolunteers')
        .populate('activeVolunteers');
    })
    .then(company => response.json(company.getCensoredVolunteers()))
    .catch(next);
});

companyAuthRouter.delete('/company/delete', bearerAuthCompany, (request, response, next) => {
  let data = {};
  return Company.findById(request.company._id)
    .populate('pendingVolunteers')
    .populate('activeVolunteers')
    .then(company => {
      data.pending = company.pendingVolunteers;
      data.active = company.activeVolunteers;

      return Promise.all(data.pending.map(volunteer => {
        volunteer.pendingCompanies = volunteer.pendingCompanies.filter(companyId => companyId.toString() !== request.company._id.toString());
        return volunteer.save();
      }));
    })
    .then(() => {
      return Promise.all(data.active.map(volunteer => {
        volunteer.activeCompanies = volunteer.activeCompanies.filter(companyId => companyId.toString() !== request.company._id.toString());
        return volunteer.save();
      }));
    })
    .then(() => Company.findByIdAndRemove(request.company._id))
    .then(() => response.sendStatus(204))
    .catch(next);
});
