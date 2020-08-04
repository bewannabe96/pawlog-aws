import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async () => {
	try {
		const result = await _getPartnerTypes();
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _getPartnerTypes = async () => {
	let transaction = mysqlConn.transaction();

	transaction = transaction.query('SELECT code, name FROM partnertype;');

	const [result] = await transaction.commit();
	mysqlConn.end();

	return {
		partnerTypes: result.map((row: any) => ({
			code: row.code,
			name: row.name,
		})),
	};
};
