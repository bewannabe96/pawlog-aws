import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';

import Petshop from '../model/petshop';

import { createResponse } from '../util/response';
import PetshopDBManager from '../database-manager/petshop';

export const createPetshop: APIGatewayProxyHandler = async event => {
	const petshop: Petshop = JSON.parse(event.body);

	try {
		const id = await PetshopDBManager.createPetshop(petshop);
		return createResponse(200, { id: id });
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};

export const readPetshop: APIGatewayProxyHandler = async event => {
	const petshopID = event.pathParameters.petshopID;

	try {
		const petshop = await PetshopDBManager.readPetshop(petshopID);
		return createResponse(200, petshop);
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};

export const updatePetshop: APIGatewayProxyHandler = async event => {
	const petshopID = event.pathParameters.petshopID;
	const petshop: Petshop = JSON.parse(event.body);

	try {
		await PetshopDBManager.updatePetshop(petshopID, petshop);
		return createResponse(200, { id: petshopID });
	} catch (e) {
		console.log(e);
		return createResponse(500, {});
	}
};
