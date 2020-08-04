import { APIGatewayProxyHandler } from 'aws-lambda';

import { Review } from '../../model';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const createPartnerReview: APIGatewayProxyHandler = async (event) => {
	const partnerID = event.pathParameters.partnerID;
	const data = JSON.parse(event.body) as {
		userID: string;
		review: Review;
	};

	try {
		const result = await _createPartnerReview(
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

const _createPartnerReview = async (
	partnerID: string,
	userID: string,
	review: Review,
) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query(
			'INSERT INTO review (partnerid, userid, rate, content) VALUES (?, ?, ?, ?);',
			[partnerID, userID, review.rate, review.content],
		)
		.query(
			'UPDATE partner SET ratesum=ratesum+?, reviews=reviews+1 WHERE id=?;',
			[review.rate, partnerID],
		);

	const [result1] = await transaction.commit();
	mysqlConn.end();

	return {
		reviewID: `${result1.insertId}`,
		review: review,
	};
};
