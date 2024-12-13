import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

// Initialize DynamoDB Document Client
const client = new DynamoDBClient({});
const dynamodbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    // Parse the incoming request body
    const { amount, category, description, date } = JSON.parse(event.body);
   
    // Get the user ID from the Cognito authorizer
    const userId = event.requestContext.authorizer.claims.sub;

    // Create an expense object
    const expense = {
      id: uuidv4(),
      userId,
      amount: parseFloat(amount),
      category,
      description,
      date: date || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Save the expense to DynamoDB
    const command = new PutCommand({
      TableName: process.env.EXPENSES_TABLE,
      Item: expense
    });

    await dynamodbDocClient.send(command);

    // Return success response
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expense)
    };
  } catch (error) {
    console.error('Error creating expense:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Failed to create expense',
        error: error.message
      })
    };
  }
};