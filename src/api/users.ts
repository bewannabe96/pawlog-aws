import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../util/response';

import UserService from '../service/user';

// getUser
export const getUser: APIGatewayProxyHandler = async (event) => {
	event.queryStringParameters = event.queryStringParameters || {};

	const sub = event.queryStringParameters.sub;

	try {
		const result = await UserService.getUser(sub);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		switch (error) {
			case 'UserNotFound':
				return createResponse(404, {
					message: 'User does not exist.',
				});
			default:
				return createResponse(500, error);
		}
	}
};
