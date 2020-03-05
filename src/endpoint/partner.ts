import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';

import Partner from '../model/partner';

import PartnerDBManager from '../database-manager/partner';
import PartnerImageDBManager from '../database-manager/partner-image';

import { createResponse } from '../util/response';

export const createPartner: APIGatewayProxyHandler = async event => {
	const partner: Partner = JSON.parse(event.body);

	try {
		const id = await PartnerDBManager.createPartner(partner);
		return createResponse(200, { id: id });
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};

export const readPartner: APIGatewayProxyHandler = async event => {
	const partnerID = event.pathParameters.partnerID;

	try {
		const entity = await PartnerDBManager.readPartner(partnerID);
		const images = await PartnerImageDBManager.readImages(partnerID);

		return createResponse(200, {
			id: entity.id,
			type: entity.type,
			name: entity.name,
			images: images,
			areacode: entity.areacode,
			location: {
				address: entity.address,
				lat: entity.lat,
				lng: entity.lng,
			},
			operatingHours: {
				mon: entity.monoh,
				tue: entity.tueoh,
				wed: entity.wedoh,
				thu: entity.thuoh,
				fri: entity.frioh,
				sat: entity.satoh,
				sun: entity.sunoh,
				ph: entity.phoh,
			},
			contact: {
				email: entity.email,
				phone: entity.phone,
			},
		});
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
		await PartnerImageDBManager.updateImages(partnerID, parsedBody.images);
		return createResponse(200, { id: partnerID });
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};
