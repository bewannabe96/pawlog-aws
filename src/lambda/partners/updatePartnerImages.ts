import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import { partnerImagesToReferences } from '../../util/image';

export const handler: APIGatewayProxyHandler = async (event) => {
	const partnerID = event.pathParameters.partnerID;
	const data = JSON.parse(event.body) as { uids: string[] };

	try {
		const result = await _updatePartnerImages(partnerID, data.uids);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _updatePartnerImages = async (partnerID: string, uids: string[]) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction.query(
		'UPDATE partner SET images=?, updated=NOW() WHERE id=?;',
		[uids.join(':'), partnerID],
	);

	await transaction.commit();
	mysqlConn.end();

	return {
		images: partnerImagesToReferences(partnerID, uids.join(':')),
	};
};
