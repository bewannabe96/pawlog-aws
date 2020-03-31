import AWS from 'aws-sdk';
import { S3Handler, S3Event } from 'aws-lambda';
import sharp from 'sharp';

const s3 = new AWS.S3();

// resizeImage
export const resizeImage: S3Handler = async (event: S3Event) => {
	const bucket = event.Records[0].s3.bucket.name;
	const key = decodeURIComponent(event.Records[0].s3.object.key);
	const keyPath = key.split('/');

	if (keyPath[0] !== 'uploads') return;

	const data = await new Promise<AWS.S3.GetObjectOutput>((resolve, reject) =>
		s3.getObject({ Bucket: bucket, Key: key }, (error, data) => {
			if (data) resolve(data);
			else reject(error);
		}),
	);
	const partnerID = data.Metadata['partner'];

	const buffer = await new Promise((resolve, reject) =>
		sharp(data.Body as any)
			.resize({ width: 1024, height: 768, fit: sharp.fit.cover })
			.jpeg()
			.toBuffer((error, buffer) => {
				if (buffer) resolve(buffer);
				else reject(error);
			}),
	);

	await new Promise((resolve, reject) =>
		s3.putObject(
			{
				Bucket: bucket,
				ContentType: 'image/jpeg',
				ACL: 'public-read',
				Key: `${partnerID}/${keyPath[1]}`,
				Body: buffer,
			},
			(error, data) => {
				if (data) resolve(data);
				else reject(error);
			},
		),
	);

	await new Promise((resolve, reject) =>
		s3.deleteObject({ Bucket: bucket, Key: key }, (error, data) => {
			if (data) resolve(data);
			else reject(error);
		}),
	);
};
