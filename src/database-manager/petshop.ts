import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { v4 as uuidv4 } from 'uuid';

import Petshop from '../model/petshop';

const dynamodb = new DocumentClient({
	region: 'localhost',
	endpoint: 'http://localhost:8000',
});

namespace PetshopDBManager {
	export const createPetshop = async (petshop: Petshop) => {
		const uid = uuidv4();
		const params: DocumentClient.PutItemInput = {
			TableName: process.env.PETSHOP_TABLE,
			Item: {
				id: uid,
				name: petshop.name,
				images: petshop.images,
				location: petshop.location,
				operatingHours: petshop.operatingHours,
				contact: petshop.contact,
				rating: 0,
				reviews: [],
			},
		};

		return dynamodb
			.put(params)
			.promise()
			.then(() => uid);
	};

	export const readPetshop = async (id: string) => {
		const params: DocumentClient.GetItemInput = {
			TableName: process.env.PETSHOP_TABLE,
			Key: {
				id: id,
			},
		};

		return dynamodb
			.get(params)
			.promise()
			.then(result => result.Item);
	};

	export const updatePetshop = async (id: string, petshop: Petshop) => {
		const expression = 'SET #n=:n, #i=:i, #o=:o, #l=:l, #c=:c';
		const attrNames = {
			'#n': 'name',
			'#i': 'images',
			'#o': 'operatingHours',
			'#l': 'location',
			'#c': 'contact',
		};
		const attrValues = {
			':n': petshop.name,
			':i': petshop.images,
			':o': petshop.operatingHours,
			':l': petshop.location,
			':c': petshop.contact,
		};

		const params: DocumentClient.UpdateItemInput = {
			TableName: process.env.PETSHOP_TABLE,
			Key: {
				id: id,
			},
			UpdateExpression: expression,
			ExpressionAttributeNames: attrNames,
			ExpressionAttributeValues: attrValues,
		};

		return dynamodb
			.update(params)
			.promise()
			.then(result => result.Attributes);
	};
}

export default PetshopDBManager;
