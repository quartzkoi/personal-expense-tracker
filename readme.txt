# Personal Expense Tracker

## Overview
The Personal Expense Tracker application enables users to create and log into personal accounts to securely manage financial transactions through a serverless architecture leveraging AWS services. 

## Architecture
- Frontend: Static S3-hosted website
- Backend: AWS Lambda functions to handle CRUD operations, as well as a RESTful API Gateway to route requests to the Lambda functions.
- Database: DynamoDB to store records of each logged expense.
- Authentication: AWS Cognito

## Prerequisites
- AWS Account
- Node.js
- AWS CLI
- Serverless Framework

## Setup Instructions
1. Install project dependencies
	npm install
2. Update 'app.js':
	Line 12: AWS Region
	Line 16: Your Cognito User Pool ID
	Line 17: Your Cognito App Client ID
3. Update 'serverless.env'with your Cognito User Pool ID/App Client ID
4. Upload files to S3 for website hosting
5. Deploy backend
	serverless deploy

## AWS Configuration
- Set up Cognito User Pool
- Implement IAM roles for the Lambda functions
- Use AWS Cognito for authentication

## AWS Deployment Checklist
- Configure Cognito User Pool
- Deploy Lambda Functions
- Set up API Gateway
- Configure S3 Website

## API Endpoints
- Create Expense - Add a new expense for the user
	Method: POST
	Endpoint: /expenses

- Get Expenses - Fetch all expenses
	Method: GET
	Endpoint: /expenses

- Update Expense - Update an existing expense
	Method: PUT
	Endpoint: /expenses/{expenseID}

- Delete Expense - Delete a specific expense
	Method: DELETE
	Endpoint: /expenses/{expenseId}


## Unit Testing
-Install Jest w/ dependencies
    npm install --save-dev jest
-Since mocking the AWS SDK, will need to install
    npm install @aws-sdk/lib-dynamodb

## Challenges Faced
- I was rusty on unit testing going into this assignment, so I did have to look up example tests/videos in order to figure out what should be tested, and how to integrate that with AWS.
- Integrating serverless start to finish was more difficult than I imagined, and I did end up initially manually doing some things which could have been more smoothly integrated with it.
- API calls are a relatively recent skill to have learned, so once I was able to cement what calls needed to be made for each function, the layout made more sense.
