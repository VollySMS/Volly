'use strict';

const mongoose = require('mongoose');
const Volunteer = require('./volunteer');


const unverifiedAccountSchema = mongoose.Schema({ 
  volunteerId: {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'volunteer',
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  timestamp: {
    type: Number,
    default: () => Date.now(),
  },
});

unverifiedAccountSchema.methods.expired = function() {
  const expireHours = 72;
  return Math.abs((Date.now() - this.timestamp) / 1000 / 60 / 60) > expireHours;
};

const UnverifiedAccount = module.exports = mongoose.model('unverifiedAccount', unverifiedAccountSchema);

UnverifiedAccount._create = (accountId, phoneNumber, accountType) => {
  let data = {phoneNumber};
  data[accountType + 'Id'] = accountId;  
  return new UnverifiedAccount(data).save();
};

UnverifiedAccount.createVolunteer = (accountId, phoneNumber) => UnverifiedAccount._create(accountId, phoneNumber, 'volunteer');

UnverifiedAccount.removeExpired = () => {
  let data = {};
  return UnverifiedAccount.find({})
    .then(unverifiedAccounts => {
      data.expiredAccounts = unverifiedAccounts.filter(unverifiedAccount => unverifiedAccount.expired());
      data.expiredVolunteers = data.expiredAccounts.filter(unverifiedAccount => unverifiedAccount.volunteerId);
      data.unverifiedAccounts = unverifiedAccounts;
      return Promise.all(data.expiredVolunteers.map(expiredVolunteer => Volunteer.findByIdAndRemove(expiredVolunteer.volunteerId)));
    })
    .then(() => Promise.all(data.expiredAccounts.map(expiredAccount => UnverifiedAccount.findByIdAndRemove(expiredAccount._id))));
};
