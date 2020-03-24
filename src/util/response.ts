import { APIGatewayProxyResult } from 'aws-lambda';

export const createResponse = <ResponseBody>(
	statusCode: number,
	body: ResponseBody,
): APIGatewayProxyResult => {
	return { statusCode: statusCode, body: JSON.stringify(body) };
};
