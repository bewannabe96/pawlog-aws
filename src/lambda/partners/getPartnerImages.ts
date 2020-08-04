import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import { partnerImagesToReferences } from '../../util/image';

export const handler: APIGatewayProxyHandler = async (event) => {
	const partnerID = event.pathParameters.partnerID;

	try {
		const result = await _getPartnerImages(partnerID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _getPartnerImages = async (partnerID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction.query('SELECT images FROM partner WHERE id=?;', [
		partnerID,
	]);

	const [result1] = await transaction.commit();
	mysqlConn.end();

	return {
		images: partnerImagesToReferences(partnerID, result1[0].images),
	};
};
