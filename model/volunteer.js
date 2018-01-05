'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const httpErrors = require('http-errors');
const jsonWebToken = require('jsonwebtoken');
const mongoose = require('mongoose');
const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const ValidatorAPI = require('phone-number-validation');
const UnverifiedAccount = require('./unverified-account');
const logger = require('../lib/logger');
const phoneNumberValidation = new ValidatorAPI({
  access_key: process.env.NUMVERIFY_TOKEN,
});


const volunteerSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },

  lastName: {
    type: String,
    required: true,
  },

  userName: {
    type: String,
    unique: true,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },

  textable: {
    type: Boolean,
    required: true,
  },

  timestamp: {
    type: Date,
    default: () => new Date(),
  },

  tokenSeed: {
    type: String,
    required: true,
    unique: true,
  },

  passwordHash: {
    type: String,
    required: true,
  },

  activeCompanies: [{
    type : mongoose.Schema.Types.ObjectId,
    ref : 'company',
  }],
  
  pendingCompanies: [{
    type : mongoose.Schema.Types.ObjectId,
    ref : 'company',
  }],
},
{
  usePushEach : true,
});

const promisify = (fn) => (...args) => {
  return new Promise((resolve,reject) => {
    fn(...args,(error,data) => {
      if(error)
        return reject(error);
      return resolve(data);
    });
  });
};

volunteerSchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash)
    .then(response => {
      if(!response)
        throw new httpErrors(401, '__AUTH__ unauthorized');
      return this;
    });
};

volunteerSchema.methods.initiateValidation = function() {
  return promisify(phoneNumberValidation.validate)({number: this.phoneNumber.slice(1)})
    .then(results => {      
      if(results.line_type === 'mobile'){
        return client.messages.create({
          to: this.phoneNumber,
          from: process.env.TWILIO_PHONE_NUMBER,
          body: `Volly: Reply YES to receive text alerts.`,
        })
          .then(() => UnverifiedAccount.createVolunteer(this._id, this.phoneNumber));
      }
      return null;
    });
};

volunteerSchema.methods.changePassword = function(password) {
  const HASH_SALT_ROUNDS = 8;
  return bcrypt.hash(password, HASH_SALT_ROUNDS)
    .then(passwordHash => {
      this.passwordHash = passwordHash;
      return this.save();
    });
};

volunteerSchema.methods.createToken = function() {
  this.tokenSeed = crypto.randomBytes(64).toString('hex');
  return this.save()
    .then(volunteer => {
      return jsonWebToken.sign({
        tokenSeed: volunteer.tokenSeed,
      }, process.env.SALT_SECRET);
    });
};

volunteerSchema.methods._censorCompanies = (array) => {
  return array.map(pendingCompany => ({
    companyId: pendingCompany._id,
    companyName: pendingCompany.companyName,
    phoneNumber: pendingCompany.phoneNumber,
    email: pendingCompany.email,
    website: pendingCompany.website,
  }));
};

volunteerSchema.methods.getCensoredCompanies = function() {
  return {
    pendingCompanies: this._censorCompanies(this.pendingCompanies), 
    activeCompanies: this._censorCompanies(this.activeCompanies),
  };
};

const Volunteer = module.exports = mongoose.model('volunteer', volunteerSchema);

Volunteer.create = (firstName, lastName, userName, password, email, phoneNumber, textable = false) => {
  const HASH_SALT_ROUNDS = 8;
  return bcrypt.hash(password, HASH_SALT_ROUNDS)
    .then(passwordHash => {
      let tokenSeed = crypto.randomBytes(64).toString('hex');
      return new Volunteer({
        firstName,
        lastName,
        userName,
        passwordHash,
        email,
        phoneNumber,
        textable,
        tokenSeed,
      }).save();
    });
};

Volunteer.model = 'volunteer';
Volunteer.login = 'user';
