import { APIGatewayProxyHandler } from 'aws-lambda';
import sharp from 'sharp';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import s3Bucket from '../../util/s3-bucket';
import { reviewImagesToReferences } from '../../util/image';

export const handler: APIGatewayProxyHandler = async (event) => {
	const partnerID = event.pathParameters.partnerID;
	const reviewID = event.pathParameters.reviewID;
	const uid = event.pathParameters.uid;
	const data = Buffer.from(event.body, 'base64');

	try {
		const result = await _addPartnerReviewImage(partnerID, reviewID, uid);
		await _uploadReviewImage(partnerID, reviewID, uid, data);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		switch (error) {
			case 'ImageCapacityFull':
				return createResponse(500, {
					message:
						'Maximum 2 images are allowed. No more images can be uploaded.',
				});
			default:
				return createResponse(500, error);
		}
	}
};

const _addPartnerReviewImage = async (
	partnerID: string,
	reviewID: string,
	uid: string,
) => {
	let transaction = mysqlConn.transaction();
	transaction = transaction.query('SELECT images FROM review WHERE id=?;', [
		reviewID,
	]);
	const [result1] = await transaction.commit();

	const uids: string[] =
		result1[0].images === '' ? [] : result1[0].images.split(':');
	if (uids.length >= 2) throw 'ImageCapacityFull';
	uids.push(uid);

	transaction = mysqlConn.transaction();
	transaction = transaction.query('UPDATE review SET images=? WHERE id=?;', [
		uids.join(':'),
		reviewID,
	]);
	await transaction.commit();

	mysqlConn.end();

	return reviewImagesToReferences(partnerID, reviewID, uid)[0];
};

const _uploadReviewImage = async (
	partnerID: string,
	reviewID: string,
	uid: string,
	data: Buffer,
) => {
	const buffer = await new Promise((resolve, reject) =>
		sharp(data)
			.resize({ width: 1024, height: 768, fit: sharp.fit.cover })
			.jpeg()
			.toBuffer((error, buffer) => {
				if (buffer) resolve(buffer);
				else reject(error);
			}),
	);

	await new Promise((resolve, reject) =>
		s3Bucket.putObject(
			{
				Bucket: process.env.PARTNER_IMAGE_BUCKET,
				ACL: 'public-read',
				Key: `${partnerID}/${reviewID}/${uid}`,
				ContentType: 'image/jpeg',
				Body: buffer,
			},
			(error, data) => {
				if (data) resolve(data);
				else reject(error);
			},
		),
	);
};
