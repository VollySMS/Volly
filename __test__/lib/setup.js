'use strict';

const twilioTestToken = 'b9bf2c9a7cc8f3f681638c4a77283abd';
const twilioTestSID = 'ACf203fd67ff4b5049a2779370ef9ad3da';
const twilioTestPhone = '+15005550006';
const PORT = 3000;

process.env.PORT = PORT;
process.env.MONGODB_URI = 'mongodb://localhost/testing';
process.env.SALT_SECRET = 'pedjanthonyROBinson';
process.env.API_URL = `http://localhost:${PORT}`;
process.env.TWILIO_SID = twilioTestSID;
process.env.TWILIO_TOKEN = twilioTestToken;
process.env.TWILIO_PHONE_NUMBER = twilioTestPhone;