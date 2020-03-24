import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../util/response';

import UserService from '../service/user';

// getUser
export const getUser: APIGatewayProxyHandler = async event => {
	event.queryStringParameters = event.queryStringParameters || {};

	const sub = event.queryStringParameters.sub;

	try {
		const result = await UserService.getUser(sub);
		if (result) return createResponse(200, result);
		else
			return createResponse(404, {
				code: 1001,
				message: 'User does not exist.',
			});
	} catch (error) {
		return createResponse(500, {
			message: error,
		});
	}
};
