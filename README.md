
<h1 align="center">
  <br>
  <a href="https://volly-sms.herokuapp.com"><img src="https://i.imgur.com/NFMAaQS.png" alt="Volly" width="200"></a>
  <br>
  Volly SMS
  <br>
</h1>

*Volly* is a volunteer management portal that helps non-profits manage their interactions with volunteers.

Companies and volunteers sign up independently and connect via volunteer-initiated applications. Once approved by a company, the volunteer is added to the company's active pool, at which point volunteers can be contacted via text message.

*Volly* is a back-end *REST*ful API that allows for basic CRUD operations.

## Build Status

[![Build Status](https://travis-ci.org/VollySMS/Volly.svg?branch=master)](https://travis-ci.org/VollySMS/Volly)
[![npm](https://img.shields.io/npm/l/express.svg)](https://github.com/VollySMS/Volly/blob/master/LICENSE)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-green.svg)




## Tech / Frameworks
- node.js
    - bcrypt
    - crypto
    - dotenv
    - express
    - http-errors
    - jsonwebtoken
    - mongoose
    - superagent
    - winston
    - eslint
    - faker
    - jest
- Heroku
- MongoDB
- TravisCI


## Features

### Company

- signup
- login
- update company information
- get list of pending volunteers
- get list of active volunteers
- approve of pending volunteer
- terminate volunteer
- TODO: add remaining features

### Volunteer

- signup
- login
- update voluneer information
- list all available companies
- get list of pending companies
- get list of active companies
- apply to company
- remove application from company
- delete volunteer account
- TODO: add remaining features

## Tests

All tests run through the Jest testing suite. To run our code on your machine, first clone the repo:

```
git clone https://github.com/VollySMS/Volly.git
```

Install all dependencies by running `npm i`. Before you can run the tests, you must ensure you have [MongoDB](https://www.mongodb.com/download-center?jmp=nav#community) installed on your machine. Once Mongo is installed, start the database server with `npm run dbon`.

To run all test suites run `npm test`. To run only Company-specific tests, run `npm run test-c`, or to run only Volunteer-specific tests run `npm run test-v`.

Once all tests have run, you can turn off the database with `npm run dboff`.

## How to use?

TODO: For all of these routes, we need more detail on what to send, what to expect, and what to expect when requests are bad.

Interact with *Volly* as a company or volunteer via HTTP requests to the various endpoints at `https://volly-sms.herokuapp.com/`.

This can be achieved from a front-end or from the command line using [HTTPie](https://github.com/jakubroztocil/httpie#installation).

In order to authenticate requests using HTTPie you must also install [httpie-jwt-auth](https://github.com/teracyhq/httpie-jwt-auth).

### Company

#### `POST /company/signup`

The first step for a company is to sign up. 

Send a JSON object containing the following properties (all are Strings):

`companyName`, `password`, `email`, `phoneNumber` and `website`

Upon successfully signing up, you will receive a JSON Web Token used for authenticating future requests.

```
echo '{"companyName": "bigBobsCharityHouse", "password": "bigBobsSuperSecretPassword", "phoneNumber": "(216) 555-1234", "email": "bigBob@bbch.org", "website": "www.companywebsite.org"}' | http POST https://volly-sms.herokuapp.com/company/signup

// Response:
//
// {
//    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlblNlZWQiOiJlNjUyMWY2MmJiYWZjMTc0ZmFkMmJiM2YxZmYzMjViY2VkMjU3OTc5ZGI0NzA0ZGY5YjAzNjc1NjgyODliOTQ5NDI0NTNjN2FiZjYyMDg3NjM3NTZhYTY2ZmRlNmM4NWIxMmJmNGFiMGZjMjk3ZmZiN2MwMWRhYWZkYzBjMmUzZiIsImlhdCI6MTUxNDg2NjUwNn0.aV2SJDCL92fe8va7iERPpyOtd-JnqLjXhZGLowKyOtI"
// }
```

#### `GET /company/login`

Your token is needed to authenticate all future requests. If your token is misplaced or expires, you can login to receive a new token. Send a GET request with your `companyName` and `password` using Basic Auth to the `/company/login` endpoint. Use the HTTPie flag `-a USERNAME:PASSWORD` to authenticate yourself.

```
http GET https://volly-sms.herokuapp.com/company/login -a bigBobsCharityHouse:bigBobsSuperSecretPassword

// Response: 
//
// {
//    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlblNlZWQiOiIyMzBlZDgwNmY3YWYzY2UzZDVlN2YzYjM5NmJhNDk2ODAxZGNiNDdlYzkyZTA0ZjhiMmUyODg1YjA5ZTg1YzYxYzkzNDJmYTAyNDMzYzQ1YjEyODUxMzYxNGIyMmI3ZGY4MjMzZWJkNjRmMDA2MGU3OGFjMmUzMjNiYzcxMGViMSIsImlhdCI6MTUxNDg2NzE1Nn0.fKcmgdBBje2BPWj05XeXDMVGDD6AL6lWErPpXF0oruA"
// }
```

#### `GET company/pending`

Once you have created your account, users will be able to apply to be a volunteer with your company. You can request an array with information about each volunteer that has applied to your company. You will need to use *httpie-jwt-auth* to authenticate yourself by adding `Authorization:'Bearer <yourToken>'` after the url in your request.

```
http GET https://volly-sms.herokuapp.com/company/pending Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlblNlZWQiOiIyMzBlZDgwNmY3YWYzY2UzZDVlN2YzYjM5NmJhNDk2ODAxZGNiNDdlYzkyZTA0ZjhiMmUyODg1YjA5ZTg1YzYxYzkzNDJmYTAyNDMzYzQ1YjEyODUxMzYxNGIyMmI3ZGY4MjMzZWJkNjRmMDA2MGU3OGFjMmUzMjNiYzcxMGViMSIsImlhdCI6MTUxNDg2NzE1Nn0.fKcmgdBBje2BPWj05XeXDMVGDD6AL6lWErPpXF0oruA'

{
    "pendingVolunteers": [
        {
            "email": "goodPerson@gmail.com",
            "firstName": "Sally",
            "lastName": "Johnson",
            "phoneNumber": "(216) 555-1111",
            "volunteerId": "5a4c4f919c22fc0014afe65e"
        }
    ]
}
```

#### `PUT /company/approve`

If you have found an applicant that you would like to approve, you can make a PUT request to do so. Send an object with the `volunteerId` and make sure to authenticate your request with jwt-auth and your token.

```
echo '{"volunteerId": "5a4b0d0714fe45001431b28a"}' | http PUT https://volly-sms.herokuapp.com/company/approve Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlblNlZWQiOiIyMzBlZDgwNmY3YWYzY2UzZDVlN2YzYjM5NmJhNDk2ODAxZGNiNDdlYzkyZTA0ZjhiMmUyODg1YjA5ZTg1YzYxYzkzNDJmYTAyNDMzYzQ1YjEyODUxMzYxNGIyMmI3ZGY4MjMzZWJkNjRmMDA2MGU3OGFjMmUzMjNiYzcxMGViMSIsImlhdCI6MTUxNDg2NzE1Nn0.fKcmgdBBje2BPWj05XeXDMVGDD6AL6lWErPpXF0oruA'

// Response:
// {
//    "activeVolunteers": [
//        "5a4b0d0714fe45001431b28a"
//    ],
//    "pendingVolunteers": []
// }
```
TODO: Change this so that it shows more detailed info about the volunteer rather than just the id.

### Volunteer

#### `POST /volunteer/signup`

The first step for a volunteer is to sign up. 

Send a JSON object containing the following properties (all are Strings):

`firstName`, `lastName`, `userName`, `password`, `email`, and `phoneNumber`

Upon successfully signing up, you will receive a JSON Web Token used for authenticating future requests.

```
echo '{"firstName": "Sally", "lastName": "Johnson", "userName": "sallyVolunteer98", "password": "goodThings123", "phoneNumber": "(216) 555-1111", "email": "goodPerson@gmail.com"}' | http POST https://volly-sms.herokuapp.com/volunteer/signup
// Response:
//
// {
//    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlblNlZWQiOiI4NmZlNjlkZTU5MjgzZjIyNTFkMDZhNjI3N2U0ZjZkYTc4OTc2NWYwYTI3YzMxYWNkMjU4Mjk1ZjEyYTdhZDQwMzE1NTdmODIwNDMyYTM4NGYyZTFjY2JkMjI2ZWJlNWJlZmFhY2QwY2QyZDQxZGY4ZDJiMmY4NWM2Y2Y1NGY5NiIsImlhdCI6MTUxNDg2Nzk3NX0.roxhaNFqSxaG_-QL6-nhwX6btx8fq24S9DV-rhwLdhA"
// }
```

#### `GET /volunteer/login`

Your token is needed to authenticate all future requests. If your token is misplaced or expires, you can login to receive a new token. Send a GET request with your `userName` and `password` using Basic Auth to the `/volunteer/login` endpoint. Use the HTTPie flag `-a USERNAME:PASSWORD` to authenticate yourself.

```
http GET https://volly-sms.herokuapp.com/volunteer/login -a sallyVolunteer98:goodThings123

// Response: 
//
// {
//    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlblNlZWQiOiJkNzc2YjhkNmZiZTkwNTg3MDMwYjkzMjhjYmYwODlmZmU3ODJlOTQ5NTg5YTc3MWI5YzIyYzJhYWMxOWVkNzAzNzBkYWE2YmFkZTQ3MjA5ZWM5MmYxZTY3ZDNlMTZjYzc0MzE3MmJhYTE5ZDcyMjdjMGE0MDhiMGZjNTRmZGUyOSIsImlhdCI6MTUxNDg2ODEyOX0.fn9K2zzCLlLYORPzgQv7htyGAfrPqvHJaJaeNtXUeDs"
// }
```

#### `GET /volunteer/opportunities` 
TODO: add this route!

Once you have created an account and have your access token, you'll want to find some companies that have volunteer opportunities. Use your token to request the current list of companies. Data will be returned as an array of objects. You will need to use httpie-jwt-auth to authenticate yourself by adding `Authorization:'Bearer <yourToken>'` after the url in your request.

```
http GET https://volly-sms.herokuapp.com/volunteer/opportunities Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlblNlZWQiOiJkNzc2YjhkNmZiZTkwNTg3MDMwYjkzMjhjYmYwODlmZmU3ODJlOTQ5NTg5YTc3MWI5YzIyYzJhYWMxOWVkNzAzNzBkYWE2YmFkZTQ3MjA5ZWM5MmYxZTY3ZDNlMTZjYzc0MzE3MmJhYTE5ZDcyMjdjMGE0MDhiMGZjNTRmZGUyOSIsImlhdCI6MTUxNDg2ODEyOX0.fn9K2zzCLlLYORPzgQv7htyGAfrPqvHJaJaeNtXUeDs'

// Response:
// TODO: fill this in once written
```

#### `PUT /volunteer/apply`

Once you've found a company you want to volunteer for, apply to that company by sending an object with the `companyId` as a property. Don't forget to authenticate yourself using jwt-auth and your token.

```
echo '{"companyId": "5a4b074914fe45001431b289"}' | http PUT https://volly-sms.herokuapp.com/volunteer/apply Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlblNlZWQiOiJkNzc2YjhkNmZiZTkwNTg3MDMwYjkzMjhjYmYwODlmZmU3ODJlOTQ5NTg5YTc3MWI5YzIyYzJhYWMxOWVkNzAzNzBkYWE2YmFkZTQ3MjA5ZWM5MmYxZTY3ZDNlMTZjYzc0MzE3MmJhYTE5ZDcyMjdjMGE0MDhiMGZjNTRmZGUyOSIsImlhdCI6MTUxNDg2ODEyOX0.fn9K2zzCLlLYORPzgQv7htyGAfrPqvHJaJaeNtXUeDs'

// Response: 200
{
    "activeCompanies": [],
    "pendingCompanies": [
        {
            "companyId": "5a4c4ef39c22fc0014afe65c",
            "companyName": "bigBobsCharityHouse",
            "email": "bigBob@bbch.org",
            "phoneNumber": "(216) 555-1234",
            "website": "www.companywebsite.org"
        }
    ]
}
```

#### `PUT /volunteer/leave`

If you no longer want to volunteer for a company (or be considered by that company if not yet approved) you can leave. Send an object with the `companyId` as a property and authenticate yourself using jwt-auth and your token. You will remove yourself from that company's database, and you will remove the record of that company from your database.

```
echo '{"companyId": "5a4b074914fe45001431b289"}' | http PUT https://volly-sms.herokuapp.com/volunteer/leave Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlblNlZWQiOiJkNzc2YjhkNmZiZTkwNTg3MDMwYjkzMjhjYmYwODlmZmU3ODJlOTQ5NTg5YTc3MWI5YzIyYzJhYWMxOWVkNzAzNzBkYWE2YmFkZTQ3MjA5ZWM5MmYxZTY3ZDNlMTZjYzc0MzE3MmJhYTE5ZDcyMjdjMGE0MDhiMGZjNTRmZGUyOSIsImlhdCI6MTUxNDg2ODEyOX0.fn9K2zzCLlLYORPzgQv7htyGAfrPqvHJaJaeNtXUeDs'

// Response: 200
```

TODO: We need to change this so that the a subset of the volunteer's information is sent back, including pendingCompanies array and activeCompanies array.

## Contribute

Want to help non-profits? Contribute to our project! Fork our [repo](https://github.com/VollySMS/Volly) and make a PR. Please feel free to contact us prior to beginning any work to discuss your ideas.

## Credits

[Anthony Robinson](https://github.com/Twandalon)

[Pedja Josifovic](https://github.com/pjosifovic)

[Robert Reed](https://github.com/RobertMcReed)

## License

MIT © [Anthony Robinson](https://github.com/Twandalon), [Pedja Josifovic](https://github.com/pjosifovic) & [Robert Reed](https://github.com/RobertMcReed)