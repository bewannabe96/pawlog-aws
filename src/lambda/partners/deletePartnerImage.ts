import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import s3Bucket from '../../util/s3-bucket';

export const handler: APIGatewayProxyHandler = async (event) => {
	const partnerID = event.pathParameters.partnerID;
	const uid = event.pathParameters.uid;

	try {
		await _deletePartnerImage(partnerID, uid);
		return createResponse(200, { uid: uid });
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _deletePartnerImage = async (partnerID: string, uid: string) => {
	await new Promise((resolve, reject) =>
		s3Bucket.deleteObject(
			{
				Bucket: process.env.PARTNER_IMAGE_BUCKET,
				Key: `${partnerID}/${uid}`,
			},
			(error, data) => {
				if (data) resolve(data);
				else reject(error);
			},
		),
	);
};
