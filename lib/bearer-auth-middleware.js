'use strict';

const httpErrors = require('http-errors');
const jsonWebToken = require('jsonwebtoken');

const promisify = (fn) => (...args) => {
  return new Promise((resolve,reject) => {
    fn(...args,(error,data) => {
      if(error)
        return reject(error);
      return resolve(data);
    });
  });
};

module.exports = (Model) => (request, response, next) => {
  if(!request.headers.authorization)
    return next(new httpErrors(400, '__ERROR__ authorization header required'));

  const token = request.headers.authorization.split('Bearer ')[1];

  if(!token)
    return next(new httpErrors(400, '__ERROR__ Bearer auth required'));

  return promisify(jsonWebToken.verify)(token, process.env.SALT_SECRET)
    .then(decryptedData => Model.findOne({tokenSeed : decryptedData.tokenSeed}))
    .then(account => {
      if(!account)
        throw new httpErrors(404, '__ERROR__ not found');
      
      request[Model.model] = account;
      return next();
    })
    .catch(next);
};