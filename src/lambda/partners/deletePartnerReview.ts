import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import s3Bucket from '../../util/s3-bucket';

export const handler: APIGatewayProxyHandler = async (event) => {
	const partnerID = event.pathParameters.partnerID;
	const reviewID = event.pathParameters.reviewID;

	try {
		await _deleteReviewImages(partnerID, reviewID);
		const result = await _deletePartnerReview(partnerID, reviewID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

export const _deleteReviewImages = async (
	partnerID: string,
	reviewID: string,
) => {
	await new Promise((resolve, reject) =>
		s3Bucket.deleteObject(
			{
				Bucket: process.env.PARTNER_IMAGE_BUCKET,
				Key: `${partnerID}/${reviewID}`,
			},
			(error, data) => {
				if (data) resolve(data);
				else reject(error);
			},
		),
	);
};

const _deletePartnerReview = async (partnerID: string, reviewID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query('SELECT rate INTO @rate FROM review WHERE id=?;', [reviewID])
		.query(
			`
            UPDATE partner SET
                ratesum=ratesum-@rate,
                reviews=reviews-1
            WHERE id=?;
            `,
			[partnerID],
		)
		.query('DELETE FROM review WHERE partnerid=? AND id=?', [
			partnerID,
			reviewID,
		]);

	await transaction.commit();
	mysqlConn.end();

	return { reviewID: reviewID };
};
