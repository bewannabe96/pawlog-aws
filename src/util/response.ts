import { APIGatewayProxyResult } from 'aws-lambda';

export const createResponse = <ResponseBody>(
	statusCode: number,
	body: ResponseBody,
): APIGatewayProxyResult => {
	return {
		statusCode: statusCode,
		headers: {
			'Access-Control-Allow-Origin': 'pawloghk.com',
		},
		body: JSON.stringify(body),
	};
};
