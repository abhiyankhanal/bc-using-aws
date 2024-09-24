
import { createTransaction, getTransactionByIds } from "./service";
import {APIGatewayEvent, APIGatewayProxyResult} from 'aws-lambda';

export const lambdaHandler = async (event: APIGatewayEvent): Promise<{ statusCode: number; headers?: any; body: string }> => {

    if (event.httpMethod === 'POST' && event.path === '/'){
    let parsedBody;
    try {
      // Parse the body if it exists
      parsedBody = event.body ? JSON.parse(event.body) : {};
    } catch (error) {
      // Return an error if parsing fails
      return {
        headers: {
            'Content-Type': 'application/json',
          },
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid JSON in request body' }),
      } as APIGatewayProxyResult;
    }

  try {
    const transactionIDs = parsedBody.hash;
    const transactionDetails = await getTransactionByIds(transactionIDs);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Transaction fetched successfully',
        transactionDetails
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Failed to fetch transaction details',
        error: error.message
      }),
    };
  }
} else if(event.path === '/transaction'){
    const res = await createTransaction();
    return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: res,
          message: 'Transaction created successfully',
        }),
      };
} else {
    return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'URL not found',
        }),
      };
}};
