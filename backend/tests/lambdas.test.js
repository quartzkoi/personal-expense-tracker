// Mock AWS SDK dependencies
jest.mock('@aws-sdk/lib-dynamodb', () => {
  const mockSend = jest.fn();
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: mockSend,
      })),
    },
    UpdateCommand: jest.fn(),
  };
});

const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { handler: updateExpense } = require('../lambdas/updateExpense');

describe('Expense Tracker Lambda Functions', () => {
  const mockEvent = {
    requestContext: {
      authorizer: {
        claims: {
          sub: 'test-user-123',
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPENSES_TABLE = 'ExpensesTable';
  });

  describe('updateExpense', () => {
    test('should successfully update an expense with partial fields', async () => {
      // Prepare the update event
      const updateEvent = {
        ...mockEvent,
        pathParameters: {
          id: 'expense-123',
        },
        body: JSON.stringify({
          amount: 150,
          category: 'groceries',
        }),
      };

      // Mock the DynamoDB send method
      DynamoDBDocumentClient.from().send.mockResolvedValue({
        Attributes: {
          id: 'expense-123',
          amount: 150,
          category: 'groceries',
          userId: 'test-user-123',
        },
      });

      // Call the update expense handler
      const response = await updateExpense(updateEvent);

      // Assertions
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Expense updated successfully');
      expect(body.updatedExpense).toEqual(
        expect.objectContaining({
          id: 'expense-123',
          amount: 150,
          category: 'groceries',
        })
      );

      // Verify UpdateCommand was called with correct parameters
      expect(UpdateCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'ExpensesTable',
          Key: {
            id: 'expense-123',
            userId: 'test-user-123',
          },
          UpdateExpression: expect.stringContaining('SET'),
          ExpressionAttributeValues: expect.objectContaining({
            ':amount': 150,
            ':category': 'groceries',
          }),
          ReturnValues: 'ALL_NEW',
        })
      );
    });

    test('should handle failure to update', async () => {
      // Prepare the update event
      const updateEvent = {
        ...mockEvent,
        pathParameters: {
          id: 'expense-123',
        },
        body: JSON.stringify({
          description: 'Updated grocery shopping',
        }),
      };

      // Mock the DynamoDB send method to throw an error
      const mockError = new Error('Update failed');
      DynamoDBDocumentClient.from().send.mockRejectedValue(mockError);

      // Spy on console.error to verify logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Call the update expense handler
      const response = await updateExpense(updateEvent);

      // Assertions
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Failed to update expense');
      expect(body.error).toBe('Update failed');

      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating expense:', mockError);

      consoleErrorSpy.mockRestore();
    });

    test('should return 400 when pathParameters.id is missing', async () => {
      const updateEvent = {
        ...mockEvent,
        body: JSON.stringify({
          amount: 150,
        }),
      };
      delete updateEvent.pathParameters;

      const response = await updateExpense(updateEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid request: Missing pathParameters.id');
    });

    test('should return 400 when request body is missing', async () => {
      const updateEvent = {
        ...mockEvent,
        pathParameters: {
          id: 'expense-123',
        },
      };
      delete updateEvent.body;

      const response = await updateExpense(updateEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid request: Missing body');
    });

    test('should handle update with all possible fields', async () => {
      const updateEvent = {
        ...mockEvent,
        pathParameters: {
          id: 'expense-123',
        },
        body: JSON.stringify({
          amount: 200,
          category: 'dining',
          description: 'Dinner with friends',
          date: '2024-01-15',
        }),
      };

      DynamoDBDocumentClient.from().send.mockResolvedValue({
        Attributes: {
          id: 'expense-123',
          amount: 200,
          category: 'dining',
          description: 'Dinner with friends',
          date: '2024-01-15',
          userId: 'test-user-123',
        },
      });

      const response = await updateExpense(updateEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Expense updated successfully');
      expect(body.updatedExpense).toEqual(
        expect.objectContaining({
          amount: 200,
          category: 'dining',
          description: 'Dinner with friends',
          date: '2024-01-15',
        })
      );
    });
  });
});
