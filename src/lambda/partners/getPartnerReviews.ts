import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import { reviewImagesToReferences } from '../../util/image';

export const handler: APIGatewayProxyHandler = async (event) => {
	event.queryStringParameters = event.queryStringParameters || {};

	const partnerID = event.pathParameters.partnerID;
	const limit = event.queryStringParameters.limit ?? '10';
	const offset = event.queryStringParameters.offset ?? '0';

	try {
		const result = await _getPartnerReviews(
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

const _getPartnerReviews = async (
	partnerID: string,
	limit: number,
	offset: number,
) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction.query('SELECT count(id) total FROM review;').query(
		`
            SELECT U.id userid, U.email, U.name, U.picture, R.id reviewid, R.rate, R.images, R.content, R.created
            FROM review R
            JOIN user U
            WHERE U.id=R.userid && partnerid=?
            ORDER BY created DESC
            LIMIT ?, ?;
            `,
		[partnerID, offset * limit, limit],
	);

	const [result1, result2] = await transaction.commit();
	mysqlConn.end();

	return {
		total: result1[0].total,
		reviews: result2.map((row: any) => ({
			user: {
				id: `${row.userid}`,
				name: row.name,
				email: row.email,
				picture: row.picture,
			},
			reviewID: row.reviewid,
			review: {
				rate: row.rate,
				images: reviewImagesToReferences(partnerID, row.reviewid, row.images),
				content: row.content,
			},
			created: row.created,
		})),
	};
};
