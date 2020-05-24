import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../util/response';

// listQuestions
export const listQuestions: APIGatewayProxyHandler = async () => {
	try {
		// const result = await ConfigService.getAreas();
		// return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};
