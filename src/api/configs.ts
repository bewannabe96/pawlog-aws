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

// listPetTypes
export const listPetTypes: APIGatewayProxyHandler = async () => {
	try {
		const result = await ConfigService.getPetTypes();
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// listQuestionCategory
export const listQuestionCategory: APIGatewayProxyHandler = async () => {
	try {
		const result = await ConfigService.getQuestionCategories();
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};
