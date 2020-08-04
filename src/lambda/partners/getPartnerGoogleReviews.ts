import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async (event) => {
	const partnerID = event.pathParameters.partnerID;

	try {
		const result = await _getPartnerGoogleReviews(partnerID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _getPartnerGoogleReviews = async (partnerID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query('SELECT count(id) total FROM googlereview;')
		.query(
			'SELECT id, name, photo, rate, content, created FROM googlereview WHERE partnerid=? ORDER BY created DESC;',
			[partnerID],
		);

	const [result1, result2] = await transaction.commit();
	mysqlConn.end();

	return {
		total: result1[0].total,
		reviews: result2.map((row: any) => {
			return {
				reviewID: row.id,
				name: row.name,
				photo: row.photo,
				review: {
					rate: row.rate,
					content: row.content,
				},
				created: row.created,
			};
		}),
	};
};
