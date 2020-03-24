import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../util/response';

import { Location, OperatingHours, Contact, Review } from '../model';

import PartnerService from '../service/partner';

// listPartners
export const listPartners: APIGatewayProxyHandler = async event => {
	event.queryStringParameters = event.queryStringParameters || {};

	const limit = event.queryStringParameters.limit ?? '10';
	const offset = event.queryStringParameters.offset ?? '0';

	try {
		const result = await PartnerService.getPartners(
			parseInt(limit),
			parseInt(offset),
		);
		return createResponse(200, result);
	} catch (error) {
		return createResponse(500, {
			message: error,
		});
	}
};

// createPartner
export const createPartner: APIGatewayProxyHandler = async event => {
	const data = JSON.parse(event.body) as {
		name: string;
		areacode: string;
		location: Location;
	};

	try {
		const result = await PartnerService.createPartner(
			data.name,
			data.areacode,
			data.location,
		);
		return createResponse(200, result);
	} catch (error) {
		return createResponse(500, {
			message: error,
		});
	}
};

// getPartnerDetail
export const getPartnerDetail: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;

	try {
		const result = await PartnerService.getPartnerDetail(partnerID);
		return createResponse(200, result);
	} catch (error) {
		return createResponse(500, {
			message: error,
		});
	}
};

// updatePartnerDetail
export const updatePartnerDetail: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;
	const data = JSON.parse(event.body) as {
		name: string;
		areacode: string;
		location: Location;
		operatingHours: OperatingHours;
		contact: Contact;
	};

	try {
		const result = await PartnerService.updatePartnerDetail(
			partnerID,
			data.name,
			data.areacode,
			data.location,
			data.operatingHours,
			data.contact,
		);
		return createResponse(200, result);
	} catch (error) {
		return createResponse(500, {
			message: error,
		});
	}
};

// getPartnerImages
export const getPartnerImages: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;

	try {
		const result = await PartnerService.getPartnerImages(partnerID);
		return createResponse(200, result);
	} catch (error) {
		return createResponse(500, {
			message: error,
		});
	}
};

// updatePartnerImages
export const updatePartnerImages: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;
	const data = JSON.parse(event.body) as { images: string[] };

	try {
		const result = await PartnerService.updatePartnerImages(
			partnerID,
			data.images,
		);
		return createResponse(200, result);
	} catch (error) {
		return createResponse(500, {
			message: error,
		});
	}
};

// getPartnerReviews
export const getPartnerReviews: APIGatewayProxyHandler = async event => {
	event.queryStringParameters = event.queryStringParameters || {};

	const partnerID = event.pathParameters.partnerID;
	const limit = event.queryStringParameters.limit ?? '10';
	const offset = event.queryStringParameters.offset ?? '0';

	try {
		const result = await PartnerService.getPartnerReviews(
			partnerID,
			parseInt(limit),
			parseInt(offset),
		);
		return createResponse(200, result);
	} catch (error) {
		return createResponse(500, {
			message: error,
		});
	}
};

// createPartnerReview
export const createPartnerReview: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;
	const data = JSON.parse(event.body) as {
		userID: string;
		review: Review;
	};

	try {
		const result = await PartnerService.createPartnerReview(
			partnerID,
			data.userID,
			data.review,
		);
		return createResponse(200, result);
	} catch (error) {
		return createResponse(500, {
			message: error,
		});
	}
};
