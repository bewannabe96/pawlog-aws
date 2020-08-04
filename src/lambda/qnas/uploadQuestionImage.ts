import { APIGatewayProxyHandler } from 'aws-lambda';
import sharp from 'sharp';

import { createResponse } from '../../util/response';
import s3Bucket from '../../util/s3-bucket';

export const handler: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;
	const uid = event.pathParameters.uid;
	const data = Buffer.from(event.body, 'base64');

	try {
		await _uploadQnAImage(questionID, uid, data);
		return createResponse(200, { uid: uid });
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _uploadQnAImage = async (
	questionID: string,
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
				Bucket: process.env.QNA_IMAGE_BUCKET,
				ACL: 'public-read',
				Key: `${questionID}/${uid}`,
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
