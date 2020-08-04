import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async () => {
	try {
		const result = await _getAreas();
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _getAreas = async () => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query('SELECT code, name FROM areagroup;')
		.query('SELECT code, groupcode, name FROM area;');

	const [result1, result2] = await transaction.commit();
	mysqlConn.end();

	return {
		groups: result1.map((row: any) => ({
			code: row.code,
			name: row.name,
		})),
		areas: result2.map((row: any) => ({
			code: row.code,
			group: row.groupcode,
			name: row.name,
		})),
	};
};
