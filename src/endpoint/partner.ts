import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';

import Partner from '../model/partner';
import Review from '../model/review';

import PartnerDBManager from '../database-manager/partner';

import { createResponse } from '../util/response';

export const readPartnerList: APIGatewayProxyHandler = async event => {
	const type = event.queryStringParameters?.type
		? parseInt(event.queryStringParameters.type)
		: 0;
	const page = event.queryStringParameters?.page
		? parseInt(event.queryStringParameters.page)
		: 1;

	try {
		const result = await PartnerDBManager.reatPartners(type, page);

		return createResponse(200, result);
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};

export const createPartner: APIGatewayProxyHandler = async event => {
	const parsedBody = JSON.parse(event.body);

	try {
		const id = await PartnerDBManager.createPartner(parsedBody as Partner);
		return createResponse(200, { partnerID: id });
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};

export const readPartner: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;

	try {
		const result = await PartnerDBManager.readPartner(partnerID);

		return createResponse(200, result);
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};

export const updatePartner: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;
	const partner: Partner = JSON.parse(event.body);

	try {
		await PartnerDBManager.updatePartner(partnerID, partner);

		return createResponse(200, { id: partnerID });
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};

export const updateImages: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;
	const parsedBody = JSON.parse(event.body);

	try {
		await PartnerDBManager.updateImages(partnerID, parsedBody.images);

		return createResponse(200, { id: partnerID });
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};

export const createReview: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;
	const parsedBody = JSON.parse(event.body);

	try {
		const result = await PartnerDBManager.createReview(
			partnerID,
			parsedBody as Review,
		);
		return createResponse(200, result);
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};
