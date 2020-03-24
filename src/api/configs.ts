import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../util/response';

import ConfigService from '../service/config';

// listAreaCodes
export const listAreaCodes: APIGatewayProxyHandler = async () => {
	try {
		const result = await ConfigService.getAreas();
		return createResponse(200, result);
	} catch (error) {
		return createResponse(500, {
			message: error,
		});
	}
};

// listPartnerTypes
export const listPartnerTypes: APIGatewayProxyHandler = async () => {
	try {
		const result = await ConfigService.getPartnerTypes();
		return createResponse(200, result);
	} catch (error) {
		return createResponse(500, {
			message: error,
		});
	}
};
