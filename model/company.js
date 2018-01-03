'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const httpErrors = require('http-errors');
const jsonWebToken = require('jsonwebtoken');
const mongoose = require('mongoose');

const companySchema = mongoose.Schema({ 
  passwordHash: {
    type: String,
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
  companyName: {
    type: String,
    required: true,
    unique: true,
  },
  website: {
    type: String,
    required: true,
    unique: true,
  },
  tokenSeed: {
    type: String,
    required: true,
    unique: true,
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

companySchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash)
    .then(response => {
      if(!response) {
        throw new httpErrors(401, '__AUTH__ unauthorized');
      }
      return this;
    });
};

companySchema.methods.changePassword = function(password) {
  const HASH_SALT_ROUNDS = 8;
  return bcrypt.hash(password, HASH_SALT_ROUNDS)
    .then(passwordHash => {
      this.passwordHash = passwordHash;
      return this.save();
    });
};

companySchema.methods.createToken = function() {
  this.tokenSeed = crypto.randomBytes(64).toString('hex');
  return this.save()
    .then(company => {
      return jsonWebToken.sign({
        tokenSeed: company.tokenSeed,
      }, process.env.SALT_SECRET);
    });
};

companySchema.methods._censorVolunteers = (array) => {
  return array.map(pendingVolunteers => ({
    volunteerId: pendingVolunteers._id,
    firstName: pendingVolunteers.firstName,
    lastName: pendingVolunteers.lastName,
    phoneNumber: pendingVolunteers.phoneNumber,
    email: pendingVolunteers.email,
  }));
};

companySchema.methods.getCensoredVolunteers = function() {
  return {
    pendingVolunteers: this._censorVolunteers(this.pendingVolunteers), 
    activeVolunteers: this._censorVolunteers(this.activeVolunteers),
  };
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
