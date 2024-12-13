import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB Document Client
const client = new DynamoDBClient({});
const dynamodbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    // Get the user ID from the Cognito authorizer
    const userId = event.requestContext.authorizer.claims.sub;

    // Query expenses for the specific user
    const params = {
      TableName: process.env.EXPENSES_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const command = new QueryCommand(params);
    const result = await dynamodbDocClient.send(command);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result.Items || [])
    };
  } catch (error) {
    console.error('Error retrieving expenses:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Failed to retrieve expenses',
        error: error.message
      })
    };
  }
};