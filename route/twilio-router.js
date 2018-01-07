'use strict';

const {Router} = require('express');
const bodyParser = require('express').urlencoded({extended: false});
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const Volunteer = require('../model/volunteer');

const twilioRouter = module.exports = new Router();

twilioRouter.post('/verify', bodyParser, (request, response, next) => {
  let phoneNumber = request.body.From, message = null;
  let twilioStart = {
    start: true,
    yes: true,
    unstop: true,
  };
  let twilioStop = {
    stop: true,
    stopall: true,
    unsubscribe: true,
    cancel: true,
    end: true,
    quit: true,
  };

  phoneNumber = phoneNumber.replace(' ', '+');

  return Volunteer.findOne({phoneNumber})
    .then(volunteer => {
      if(!volunteer){
        response.set('Content-Type', 'text/xml');
        return response.send('<Response></Response>');
      }

      message = request.body.Body.toLowerCase().replace(/[\W_\d]/g, '');

      if(message === 'text' && volunteer.firstSubscribe) {
        volunteer.textable = true;
        volunteer.firstSubscribe = false;
        return volunteer.save()
          .then(() => {
            const twiml = new MessagingResponse();
            twiml.message('Volly: Thank you for subscribing. Reply STOP to unsubscribe.');
            response.writeHead(200, {'Content-Type': 'text/xml'});
            return response.end(twiml.toString());
          });
      }

      if(twilioStart[message] || twilioStop[message]) {
        volunteer.textable = twilioStart[message] ? true : false;
        volunteer.firstSubscribe = false;

        return volunteer.save()
          .then(() => {
            response.set('Content-Type', 'text/xml');
            return response.send('<Response></Response>');
          });
      }

      response.set('Content-Type', 'text/xml');
      return response.send('<Response></Response>');
    })
    .catch(next);
});
