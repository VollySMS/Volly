'use strict';

const httpErrors = require('http-errors');

module.exports = (Model) => (request, response, next) => {
  if(!request.headers.authorization)
    return next(new httpErrors(400, '__ERROR__ authorization header is required'));

  let base64AuthHeader = request.headers.authorization.split('Basic ')[1];

  if(!base64AuthHeader)
    return next(new httpErrors(400, '__ERROR__ Basic auth is required'));

  let stringAuthHeader = new Buffer(base64AuthHeader, 'base64').toString();

  let [accountName, password] = stringAuthHeader.split(':');

  if(!accountName || !password)
    return next(new httpErrors(400, '__ERROR__ username and password required'));

  let accountToFind = {};
  accountToFind[`${Model.login}Name`] = accountName;

  return Model.findOne(accountToFind)
    .then(account => {
      if(!account)
        throw new httpErrors(404, '__ERROR__ not found');

      return account.verifyPassword(password);
    })
    .then(account => {
      request[Model.model] = account;
      return next();
    })
    .catch(next);
};
