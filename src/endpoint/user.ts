import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';

import UserDBManager from '../database-manager/user';

import { createResponse } from '../util/response';

export const readUser: APIGatewayProxyHandler = async event => {
	const sub = event.queryStringParameters?.sub;

	if (!sub) return createResponse(400, { message: "'sub' is not provided" });

	try {
		const result = await UserDBManager.readUser(sub);

		return createResponse(200, result);
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};
