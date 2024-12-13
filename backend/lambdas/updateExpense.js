import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB Document Client
const client = new DynamoDBClient({});
const dynamodbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    // Get the user ID from the Cognito authorizer
    const userId = event.requestContext.authorizer.claims.sub;
   
    // Parse the incoming request body
    const { id } = event.pathParameters;
    const { amount, category, description, date } = JSON.parse(event.body);

    // Update expression and attribute definitions
    const updateExpression = [
      'SET',
      amount !== undefined ? '#amount = :amount' : null,
      category !== undefined ? '#category = :category' : null,
      description !== undefined ? '#description = :description' : null,
      date !== undefined ? '#date = :date' : null,
      '#updatedAt = :updatedAt'
    ].filter(Boolean).join(', ');

    const expressionAttributeNames = {
      ...(amount !== undefined && { '#amount': 'amount' }),
      ...(category !== undefined && { '#category': 'category' }),
      ...(description !== undefined && { '#description': 'description' }),
      ...(date !== undefined && { '#date': 'date' }),
      '#updatedAt': 'updatedAt'
    };

    const expressionAttributeValues = {
      ...(amount !== undefined && { ':amount': parseFloat(amount) }),
      ...(category !== undefined && { ':category': category }),
      ...(description !== undefined && { ':description': description }),
      ...(date !== undefined && { ':date': date }),
      ':updatedAt': new Date().toISOString()
    };

    // Update the expense in DynamoDB
    const command = new UpdateCommand({
      TableName: process.env.EXPENSES_TABLE,
      Key: { id, userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    await dynamodbDocClient.send(command);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Expense updated successfully' })
    };
  } catch (error) {
    console.error('Error updating expense:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Failed to update expense',
        error: error.message
      })
    };
  }
};