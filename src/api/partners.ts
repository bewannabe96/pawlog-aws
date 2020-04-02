import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../util/response';

import { Location, OperatingHours, Contact, Review } from '../model';

import PartnerService from '../service/partner';
import PartnerImageService from '../service/partner-image';

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
		console.log(error);
		return createResponse(500, error);
	}
};

// createPartner
export const createPartner: APIGatewayProxyHandler = async event => {
	const data = JSON.parse(event.body) as {
		name: string;
		types: number[];
		areacode: number;
		location: Location;
	};

	try {
		const result = await PartnerService.createPartner(
			data.name,
			data.types,
			data.areacode,
			data.location,
		);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// getPartnerDetail
export const getPartnerDetail: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;

	try {
		const result = await PartnerService.getPartnerDetail(partnerID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// updatePartnerDetail
export const updatePartnerDetail: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;
	const data = JSON.parse(event.body) as {
		name: string;
		types: number[];
		areacode: number;
		location: Location;
		operatingHours: OperatingHours;
		contact: Contact;
	};

	try {
		const result = await PartnerService.updatePartnerDetail(
			partnerID,
			data.name,
			data.types,
			data.areacode,
			data.location,
			data.operatingHours,
			data.contact,
		);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// deletePartner
export const deletePartner: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;

	try {
		await PartnerImageService.emptyPartnerImages(partnerID);
		const result = await PartnerService.deletePartner(partnerID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// getPartnerImages
export const getPartnerImages: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;

	try {
		const result = await PartnerService.getPartnerImages(partnerID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// updatePartnerImages
export const updatePartnerImages: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;
	const data = JSON.parse(event.body) as { uids: string[] };

	try {
		const result = await PartnerService.updatePartnerImages(
			partnerID,
			data.uids,
		);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// uploadPartnerImage
export const uploadPartnerImage: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;
	const uid = event.pathParameters.uid;
	const data = Buffer.from(event.body, 'base64');

	try {
		await PartnerImageService.uploadPartnerImage(partnerID, uid, data);
		return createResponse(200, { uid: uid });
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// deletePartnerImage
export const deletePartnerImage: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;
	const uid = event.pathParameters.uid;

	try {
		await PartnerImageService.deletePartnerImage(partnerID, uid);
		return createResponse(200, { uid: uid });
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
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
		console.log(error);
		return createResponse(500, error);
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
		console.log(error);
		return createResponse(500, error);
	}
};
