import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async (event) => {
	event.queryStringParameters = event.queryStringParameters || {};

	const sub = event.queryStringParameters.sub;

	try {
		const result = await _getUser(sub);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		switch (error) {
			case 'UserNotFound':
				return createResponse(404, {
					message: 'User does not exist.',
				});
			default:
				return createResponse(500, error);
		}
	}
};

const _getUser = async (sub: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction.query(
		'SELECT id, email, name, picture FROM user WHERE sub=?;',
		[sub],
	);

	const [result1] = await transaction.commit();
	mysqlConn.end();

	if (result1.length !== 1) throw 'UserNotFound';

	return {
		id: `${result1[0].id}`,
		name: result1[0].name,
		email: result1[0].email,
		picture: result1[0].picture,
	};
};
