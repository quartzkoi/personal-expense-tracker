import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB Document Client
const client = new DynamoDBClient({});
const dynamodbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    // Get the user ID from the Cognito authorizer
    const userId = event.requestContext.authorizer.claims.sub;
   
    // Get expense ID from path parameters
    const { id } = event.pathParameters;

    // Delete the expense from DynamoDB
    const command = new DeleteCommand({
      TableName: process.env.EXPENSES_TABLE,
      Key: { id, userId }
    });

    await dynamodbDocClient.send(command);

    // Return success response
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: ''
    };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Failed to delete expense',
        error: error.message
      })
    };
  }
};