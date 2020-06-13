import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

import s3Bucket from '../util/s3-bucket';

namespace QnAImageService {
	export const uploadQnAImage = async (
		questionID: string,
		data: Buffer,
	): Promise<string> => {
		const uid = uuidv4();

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

		return uid;
	};

	export const deleteQnAImages = async (questionID: string) => {
		const data = await new Promise<AWS.S3.ListObjectsOutput>(
			(resolve, reject) =>
				s3Bucket.listObjects(
					{
						Bucket: process.env.QNA_IMAGE_BUCKET,
						Prefix: `${questionID}/`,
					},
					(error, data) => {
						if (data) resolve(data);
						else reject(error);
					},
				),
		);

		if (data.Contents.length === 0) return;

		const params: AWS.S3.DeleteObjectsRequest = {
			Bucket: process.env.QNA_IMAGE_BUCKET,
			Delete: { Objects: [] },
		};

		data.Contents.forEach((content) =>
			params.Delete.Objects.push({ Key: content.Key }),
		);

		await new Promise((resolve, reject) =>
			s3Bucket.deleteObjects(params, (error, data) => {
				if (data) resolve(data);
				else reject(error);
			}),
		);
	};
}

export default QnAImageService;
