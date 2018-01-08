'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const httpErrors = require('http-errors');
const jsonWebToken = require('jsonwebtoken');

const modelMethods = module.exports = {};

modelMethods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash)
    .then(response => {
      if(!response) {
        throw new httpErrors(401, '__AUTH__ unauthorized');
      }
      return this;
    });
};

modelMethods.changePassword = function(password) {
  const HASH_SALT_ROUNDS = 8;
  return bcrypt.hash(password, HASH_SALT_ROUNDS)
    .then(passwordHash => {
      this.passwordHash = passwordHash;
      return this.save();
    });
};

modelMethods.createToken = function() {
  this.tokenSeed = crypto.randomBytes(64).toString('hex');
  return this.save()
    .then(account => {
      return jsonWebToken.sign({
        tokenSeed: account.tokenSeed,
      }, process.env.SALT_SECRET);
    });
};