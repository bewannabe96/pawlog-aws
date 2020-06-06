import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../util/response';

import ConfigService from '../service/config';

// listAreaCodes
export const listAreaCodes: APIGatewayProxyHandler = async () => {
	try {
		const result = await ConfigService.getAreas();
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// listPartnerTypes
export const listPartnerTypes: APIGatewayProxyHandler = async () => {
	try {
		const result = await ConfigService.getPartnerTypes();
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// listQuestionKeywords
export const listQuestionKeywords: APIGatewayProxyHandler = async () => {
	try {
		const result = await ConfigService.getQuestionKewords();
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};
