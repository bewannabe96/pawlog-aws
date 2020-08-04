import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import {
	reviewImagesToReferences,
	partnerImagesToReferences,
} from '../../util/image';

export const handler: APIGatewayProxyHandler = async (event) => {
	const userID = event.pathParameters.userID;

	try {
		const result = await _getUserReviews(userID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		switch (error) {
			default:
				return createResponse(500, error);
		}
	}
};

const _getUserReviews = async (userID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction.query(
		`
        SELECT P.id partnerid, P.images partnerimages, P.name,
            R.id reviewid, R.rate, R.images reviewimages, R.content, R.created
        FROM review R
            JOIN partner P ON R.partnerid = P.id
        WHERE R.userid = ?;
        `,
		[userID],
	);

	const [result] = await transaction.commit();
	mysqlConn.end();

	return {
		reviews: result.map((row: any) => ({
			partner: {
				id: `${row.partnerid}`,
				name: row.name,
				image:
					partnerImagesToReferences(row.partnerid, row.partnerimages)[0] ||
					null,
			},
			review: {
				id: `${row.reviewid}`,
				rate: row.rate,
				images: reviewImagesToReferences(
					row.partnerid,
					row.reviewid,
					row.reviewimages,
				),
				content: row.content,
				created: row.created,
			},
		})),
	};
};
