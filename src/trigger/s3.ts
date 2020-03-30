import { S3Handler, S3Event } from 'aws-lambda';

// resizeImage
export const resizeImage: S3Handler = async (event: S3Event) => {
	console.log(event);
};
