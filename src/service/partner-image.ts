import sharp from 'sharp';

import s3Bucket from '../util/s3-bucket';

namespace PartnerImageService {
	export const uploadPartnerImage = async (
		partnerID: string,
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
					Key: `${partnerID}/${uid}`,
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

	export const deletePartnerImage = async (partnerID: string, uid: string) => {
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

	export const emptyPartnerImages = async (partnerID: string) => {
		const data = await new Promise<AWS.S3.ListObjectsOutput>(
			(resolve, reject) =>
				s3Bucket.listObjects(
					{
						Bucket: process.env.PARTNER_IMAGE_BUCKET,
						Prefix: `${partnerID}/`,
					},
					(error, data) => {
						if (data) resolve(data);
						else reject(error);
					},
				),
		);

		if (data.Contents.length === 0) return;

		const params: AWS.S3.DeleteObjectsRequest = {
			Bucket: process.env.PARTNER_IMAGE_BUCKET,
			Delete: { Objects: [] },
		};

		data.Contents.forEach(content =>
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

export default PartnerImageService;
