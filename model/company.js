'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');

const modelMethods = require('../lib/model-methods');

const companySchema = mongoose.Schema({
  tokenSeed: {
    type: String,
    required: true,
    unique: true,
  },

  companyName: {
    type: String,
    required: true,
    unique: true,
  },

  passwordHash: {
    type: String,
    required: true,
  },

  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  website: {
    type: String,
    required: true,
    unique: true,
  },

  timestamp: {
    type: Date,
    default: () => new Date(),
  },

  pendingVolunteers: [{
    type : mongoose.Schema.Types.ObjectId,
    ref : 'volunteer',
  }],

  activeVolunteers: [{
    type : mongoose.Schema.Types.ObjectId,
    ref : 'volunteer',
  }],
},
{
  usePushEach : true,
});

companySchema.methods.verifyPassword = modelMethods.verifyPassword;

companySchema.methods.changePassword = modelMethods.changePassword;

companySchema.methods.createToken = modelMethods.createToken;

companySchema.methods._censorVolunteers = volunteers => {
  return volunteers.map(pendingVolunteer => ({
    volunteerId: pendingVolunteer._id,
    firstName: pendingVolunteer.firstName,
    lastName: pendingVolunteer.lastName,
    phoneNumber: pendingVolunteer.phoneNumber,
    email: pendingVolunteer.email,
  }));
};

companySchema.methods.getCensoredVolunteers = function() {
  return {
    pendingVolunteers: this.getCensoredPendingVolunteers(), 
    activeVolunteers: this.getCensoredActiveVolunteers(),
  };
};

companySchema.methods.getCensoredPendingVolunteers = function() {
  return this._censorVolunteers(this.pendingVolunteers);
};

companySchema.methods.getCensoredActiveVolunteers = function() {
  return this._censorVolunteers(this.activeVolunteers);
};

const Company = module.exports = mongoose.model('company', companySchema);

Company.create = (companyName, password, email, phoneNumber, website) => {
  const HASH_SALT_ROUNDS = 8;
  return bcrypt.hash(password, HASH_SALT_ROUNDS)
    .then(passwordHash => {
      let tokenSeed = crypto.randomBytes(64).toString('hex');
      return new Company({
        companyName,
        passwordHash,
        email,
        phoneNumber,
        website,
        tokenSeed,
      }).save();
    });
};

Company.model = Company.login = 'company';