import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';

import ConfigDBManager from '../database-manager/config';

import { createResponse } from '../util/response';

export const readAreas: APIGatewayProxyHandler = async () => {
	try {
		const rows = await ConfigDBManager.readAreas();

		const responseBody = {};
		rows.forEach(row => (responseBody[row.code] = row.name));

		return createResponse(200, responseBody);
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};

export const readPartnerTypes: APIGatewayProxyHandler = async () => {
	try {
		const rows = await ConfigDBManager.readPartnerTypes();

		const responseBody = {};
		rows.forEach(row => (responseBody[row.code] = row.name));

		return createResponse(200, responseBody);
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};
