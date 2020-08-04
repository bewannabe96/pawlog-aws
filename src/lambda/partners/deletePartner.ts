import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import s3Bucket from '../../util/s3-bucket';

export const handler: APIGatewayProxyHandler = async (event) => {
	const partnerID = event.pathParameters.partnerID;

	try {
		await _emptyPartnerImages(partnerID);
		const result = await _deletePartner(partnerID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _emptyPartnerImages = async (partnerID: string) => {
	const data = await new Promise<AWS.S3.ListObjectsOutput>((resolve, reject) =>
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

const _deletePartner = async (partnerID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query('DELETE FROM review WHERE partnerid=?;', [partnerID])
		.query('DELETE FROM googlereview WHERE partnerid=?;', [partnerID])
		.query('UPDATE answer SET refpartner=null WHERE refpartner=?;', [partnerID])
		.query('DELETE FROM ptnrtyperelation WHERE partnerid=?;', [partnerID])
		.query('DELETE FROM partnerlocation WHERE partnerid=?;', [partnerID])
		.query('DELETE FROM partnercontact WHERE partnerid=?;', [partnerID])
		.query('DELETE FROM partneroh WHERE partnerid=?;', [partnerID])
		.query('DELETE FROM partner WHERE id=?;', [partnerID]);

	await transaction.commit();
	mysqlConn.end();

	return { partnerID: partnerID };
};
