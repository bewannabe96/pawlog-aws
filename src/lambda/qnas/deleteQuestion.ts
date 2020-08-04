import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import s3Bucket from '../../util/s3-bucket';

export const handler: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;

	try {
		const result = await _deleteQuestion(questionID);
		await _deleteQnAImages(questionID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _deleteQuestion = async (questionID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query('DELETE FROM answer WHERE questionid=?;', [questionID])
		.query('DELETE FROM qstnkwrelation WHERE questionid=?;', [questionID])
		.query('DELETE FROM askerchoice WHERE questionid=?;', [questionID])
		.query('DELETE FROM question WHERE id=?;', [questionID]);

	await transaction.commit();
	mysqlConn.end();

	return { questionID: questionID };
};

const _deleteQnAImages = async (questionID: string) => {
	const data = await new Promise<AWS.S3.ListObjectsOutput>((resolve, reject) =>
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
