
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
- send text messages to active volunteers
- delete

### Volunteer

- signup
- login
- update volunteer information
- list all available companies
- get list of pending companies
- get list of active companies
- apply to companies
- remove application from company
- delete volunteer account
- opt in to receive text alerts

### Schema

<h1 align="center">
  <img src="https://i.imgur.com/XkI7LST.png" alt="Volly" width="640"></a>
</h1>

### Tests

All tests run through the Jest testing suite. To run our code on your machine, first clone the repo:

```
git clone https://github.com/VollySMS/Volly.git
```

Install all dependencies by running `npm i`. Before you can run the tests, you must ensure you have [MongoDB](https://www.mongodb.com/download-center?jmp=nav#community) installed on your machine. Once Mongo is installed, start the database server with `npm run dbon`.

To run all test suites run `npm test`. To run only Company-specific tests, run `npm run test-c`, or to run only Volunteer-specific tests run `npm run test-v`.

Once all tests have run, you can turn off the database with `npm run dboff`.

## How to use?

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
echo '{"companyName": "<companyName>", "password": "<password>", "phoneNumber": "<phoneNumber>", "email": "<email>", "website": "<website>"}' | http POST https://volly-sms.herokuapp.com/company/signup

// Response:
//
// {
//    "token": "<companyToken>"
// }
```

#### `GET /company/login`

Your token is needed to authenticate all future requests. If your token is misplaced or expires, you can login to receive a new token. Send a GET request with your `companyName` and `password` using Basic Auth to the `/company/login` endpoint. Use the HTTPie flag `-a USERNAME:PASSWORD` to authenticate yourself.

```
http GET https://volly-sms.herokuapp.com/company/login -a <companyName>:<password>

// Response:
//
// {
//    "token": "<companyToken>"
// }
```

#### `GET company/pending`

Once you have created your account, users will be able to apply to be a volunteer with your company. You can request an array with information about each volunteer that has applied to your company. You will need to use *httpie-jwt-auth* to authenticate yourself by adding `Authorization:'Bearer <yourToken>'` after the url in your request.

```
http GET https://volly-sms.herokuapp.com/company/pending Authorization:'Bearer <companyToken>'

{
    "pendingVolunteers": [
        {
            "email": "<email>",
            "firstName": "<firstName>",
            "lastName": "<lastName>",
            "phoneNumber": "<phoneNumber>",
            "volunteerId": "<volunteerId>"
        }
    ]
}
```

#### `GET company/active`

Once a pending volunteer has been approved you can request an array with information about each volunteer that has been accepted to your company. You will need to use *httpie-jwt-auth* to authenticate yourself by adding `Authorization:'Bearer <yourToken>'` after the url in your request.

```
http GET https://volly-sms.herokuapp.com/company/pending Authorization:'Bearer <companyToken>'

{
    "activeVolunteers": [
        {
            "email": "<email>",
            "firstName": "<firstName>",
            "lastName": "<lastName>",
            "phoneNumber": "<phoneNumber>",
            "volunteerId": "<volunteerId>"
        }
    ]
}
```

#### `PUT /company/approve`

If you have found an applicant that you would like to approve, you can make a PUT request to do so. Send an object with the `volunteerId` and make sure to authenticate your request with jwt-auth and your token.

```
echo '{"volunteerId": "volunteerId"}' | http PUT https://volly-sms.herokuapp.com/company/approve Authorization:'Bearer <companyToken>'

// Response:
// {
//    "activeVolunteers": [
//        "<volunteerId>"
//    ],
//    "pendingVolunteers": [
//        "<volunteerId>"
//    ]
// }
```

#### `POST /company/send`

This allows you to send messages to any volunteers that are currently active or pending and have opted in to receiving text alerts. Send an object with your `textMessage` and an array of your `volunteers` that you want to send a message to. You will need to use *httpie-jwt-auth* to authenticate yourself by adding `Authorization:'Bearer <yourToken>'` after the url in your request.

```
echo '{"textMessage": '<textMessage>', "volunteers": ['<volunteerId>']}' | http POST https://volly-sms.herokuapp.com/company/approve Authorization:'Bearer <companyToken>'
```

#### `PUT /company/terminate`

To remove a volunteer from either pending or active status you must send an object containing `volunteerId` and make sure to authenticate your request with your token.

```
echo '{"volunteerId": '<volunteerId>'}' | http PUT https://volly-sms.herokuapp.com/company/terminate Authorization:'Bearer <companyToken>'

Response:
//  {
//     "activeVolunteers": [<activeVolunteers>],
//    "pendingVolunteers": [<pendingVolunteers>]
//  }
```

#### `DELETE /company/delete`

Delete removes your company from Volly and removes your company from all volunteer pending and active lists. To delete your company from Volly you must authenticate your request with your token.

```
http DELETE https://volly-sms.herokuapp.com/company/delete Authorization:'Bearer <Company-Token>'
```

#### `PUT /company/update`

This allows you to update any of the included properties in your company: <companyName>, <email>, <password>, <phoneNumber>, <website>. You must send an object containing the properties you wish to update and the updated value. When a phone number is changed, our system will re-verify it. If your password is changed we will create a new token. Sends a response with the updated body.

```
echo '{"companyName": <companyName>, "email": <email>, "password": <password>, "phoneNumber": <phoneNumber>, "website": <website>}' | http PUT https://volly-sms.herokuapp.com/company/update Authorization:'Bearer <companyToken>'

Response:
//  {
//     "companyName": "<companyName>",
//     "email": "<email>",
//     "password": "<password>",
//     "phoneNumber": "<phoneNumber>",
//     "website": "<website>",
//
//     "token": "<companyToken>"
//  }
```


#### Volunteer

#### `POST /volunteer/signup?subscribe=<true>`

The first step for a volunteer is to sign up.

Send a JSON object containing the following properties (all are Strings):

`firstName`, `lastName`, `userName`, `password`, `email`, and `phoneNumber`

To initiate text alert validation include `?subscribe=true` at the end of the signup url.
The api will send you a text saying `Volly: Reply TEXT to receive text alerts`.

Upon successfully signing up, you will receive a JSON Web Token used for authenticating future requests.

```
echo '{"firstName": "<firstName>", "lastName": "<lastName>", "userName": "<userName>", "password": "<password>", "phoneNumber": "<phoneNumber>", "email": "<email>"}' | http POST https://volly-sms.herokuapp.com/volunteer/signup
// Response:
//
// {
//    "token": "<volunteerToken>"
// }
```

#### `GET /volunteer/login`

Your token is needed to authenticate all future requests. If your token is misplaced or expires, you can login to receive a new token. Send a GET request with your `userName` and `password` using Basic Auth to the `/volunteer/login` endpoint. Use the HTTPie flag `-a USERNAME:PASSWORD` to authenticate yourself.

```
http GET https://volly-sms.herokuapp.com/volunteer/login -a <userName>:<password>

// Response:
//
// {
//    "token": "<volunteerToken>"
// }
```

#### `GET /volunteer/opportunities`

Once you have created an account and have your access token, you'll want to find some companies that have volunteer opportunities. Use your token to request the current list of companies. Data will be returned as an array of objects. You will need to use httpie-jwt-auth to authenticate yourself by adding `Authorization:'Bearer <yourToken>'` after the url in your request.

```
http GET https://volly-sms.herokuapp.com/volunteer/opportunities Authorization:'Bearer <volunteerToken>'

// Response:
//{
// companies: {[
//    {
//     "companyId": "<companyId>",
//     "companyName": "<companyName>",
//     "email": "<email>",
//     "password": "<password>",
//     "phoneNumber": "<phoneNumber>",
//     "website": "<website>",
//    },
// ]}
//}
//
```

### `GET /volunteer/pending`

You can request an array with information about each company that you have a pending application in. You will need to use *httpie-jwt-auth* to authenticate yourself by adding `Authorization:'Bearer <yourToken>'` after the url in your request.

```
http GET https://volly-sms.herokuapp.com/volunteer/pending Authorization:'Bearer <volunteerToken>'

Response:
//  pendingCompanies:
//  [
//  {
//     "companyName": <companyName>,
//     "email": <email>,
//     "password": <password>,
//     "phoneNumber": <phoneNumber>,
//     "website": <website>,
//  }
//  ]
```

#### `GET /volunteer/active`

You can request an array with information about each company that you are currently active in. You will need to use *httpie-jwt-auth* to authenticate yourself by adding `Authorization:'Bearer <yourToken>'` after the url in your request.

```
http GET https://volly-sms.herokuapp.com/volunteer/active Authorization:'Bearer <volunteerToken>'

Response:
//  activeCompanies:
//  [
//  {
//     "companyName": <companyName>,
//     "email": <email>,
//     "password": <password>,
//     "phoneNumber": <phoneNumber>,
//     "website": <website>,
//  }
//  ]
```

#### `PUT /volunteer/update?subscribe=<true>`

This allows you to update any of the included properties: <userName>, <email>, <phoneNumber>, <firstName>, <lastName>,  <password>. You must send an object containing the properties you wish to update and the updated value. When a phone number is changed, our system will re-verify it. If your password is changed we will create a new token. Sends a response with the updated body.

To initiate text alert validation include `?subscribe=true` at the end of the signup url.
The api will send you a text saying `Volly: Reply TEXT to receive text alerts`.

```
echo '{"userName": <companyName>, "email": <email>, "password": <password>, "phoneNumber": <phoneNumber>, "website": <website>}' | http PUT https://volly-sms.herokuapp.com/company/update Authorization:'Bearer <volunteerToken>'

Response:
//  {
//     "userName": <userName>,
//     "email": <email>,
//     "phoneNumber": <phoneNumber>,
//     "firstName": <firstName>,
//     "lastName": <lastName>,
//
//     "token": "<volunteerToken>"
//  }
```



#### `PUT /volunteer/apply`

Once you've found a company you want to volunteer for, apply to that company by sending an object with the `companyId` as a property. Don't forget to authenticate yourself using jwt-auth and your token.

```
echo '{"companyId": "<companyId>"}' | http PUT https://volly-sms.herokuapp.com/volunteer/apply Authorization:'Bearer <volunteerToken>'

// Response: 200
//{
//    "activeCompanies": [],
//    "pendingCompanies": [
//        {
//            "companyId": "<companyId>",
//            "companyName": "<companyName>",
//            "email": "<email>",
//            "phoneNumber": "<phoneNumber>",
//            "website": "<website>"
//        }
//    ]
//}
```

#### `PUT /volunteer/leave`

If you no longer want to volunteer for a company (or be considered by that company if not yet approved) you can leave. Send an object with the `companyId` as a property and authenticate yourself using jwt-auth and your token. You will remove yourself from that company's database, and you will remove the record of that company from your database.

```
echo '{"companyId": "<companyId>"}' | http PUT https://volly-sms.herokuapp.com/volunteer/leave Authorization:'Bearer <volunteerToken>'

// Response: 200
//{
//    "activeCompanies": [remaining active companies],
//    "pendingCompanies": [remaining pending companies]
//}
```

#### `DELETE /volunteer/delete`

Delete removes your account from Volly and removes your account from all company pending and active lists. To delete your account from Volly you must authenticate your request with your token.

```
http DELETE https://volly-sms.herokuapp.com/volunteer/delete Authorization:'Bearer <volunteerToken>'
```

## Contribute

Want to help non-profits? Contribute to our project! Fork our [repo](https://github.com/VollySMS/Volly) and make a PR. Please feel free to contact us prior to beginning any work to discuss your ideas.

## Credits

[Anthony Robinson](https://github.com/Twandalon)

[Pedja Josifovic](https://github.com/pjosifovic)

[Robert Reed](https://github.com/RobertMcReed)

## License

MIT © [Anthony Robinson](https://github.com/Twandalon), [Pedja Josifovic](https://github.com/pjosifovic) & [Robert Reed](https://github.com/RobertMcReed)
