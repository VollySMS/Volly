# 1) POST /volunteer/signup

## TEXT SENT

echo '{"userName": "demiTheDog", "password": "iAmDog", "firstName": "Demi", "lastName": "Hamm", "email": "demi@demi.dog", "phoneNumber": "+19074617132"}' | http POST 'https://volly-sms.herokuapp.com/volunteer/signup?subscribe=true'



// replace all with VOLUNTEER TOKEN!

<VOLUNTEER_TOKEN>





# 2) POST /company/signup

echo '{"companyName": "Big Bobs Charity House", "password": "helpingHands", "website": "https://www.bbch.org", "email": "bigBob@bbch.org", "phoneNumber": "+12065551234"}' | http POST https://volly-sms.herokuapp.com/company/signup



// replace all with COMPANY TOKEN!

<COMPANY_TOKEN>





# 3) GET /volunteer/opportunities

http GET https://volly-sms.herokuapp.com/volunteer/opportunities Authorization:'Bearer <VOLUNTEER_TOKEN>'



// replace all with COMPANY ID!

<COMPANY_ID>





# 4) PUT /volunteer/apply

echo '{"companyId": "<COMPANY_ID>"}' | http PUT https://volly-sms.herokuapp.com/volunteer/apply Authorization:'Bearer <VOLUNTEER_TOKEN>'





# 5) GET /company/pending

http GET https://volly-sms.herokuapp.com/company/pending Authorization:'Bearer <COMPANY_TOKEN>'



// replace all with VOLUNTEER ID!

<VOLUNTEER_ID>





# 6) PUT /company/approve

## TEXT SENT

echo '{"volunteerId": "<VOLUNTEER_ID>"}' | http PUT https://volly-sms.herokuapp.com/company/approve Authorization:'Bearer <COMPANY_TOKEN>'





# 7) POST /company/send

## TEXT SENT

echo '{"volunteers": ["<VOLUNTEER_ID>"], "textMessage": "Hey Demi, how is it going? Thanks for volunteering!"}' | http POST https://volly-sms.herokuapp.com/company/send Authorization:'Bearer <COMPANY_TOKEN>'





# 8) PUT /company/terminate

## Text Sent

echo '{"volunteerId": "<VOLUNTEER_ID>"}' | http PUT https://volly-sms.herokuapp.com/company/terminate Authorization:'Bearer <COMPANY_TOKEN>'