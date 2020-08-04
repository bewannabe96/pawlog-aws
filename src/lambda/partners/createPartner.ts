import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async (event) => {
	const data = JSON.parse(event.body) as {
		name: string;
		types: number[];
	};

	try {
		const result = await _createPartner(data.name, data.types);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _createPartner = async (name: string, types: number[]) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query('INSERT INTO partner (name) VALUES (?);', [name])
		.query('SELECT LAST_INSERT_ID() INTO @insertid;');

	types.forEach((type) => {
		transaction = transaction.query(
			'INSERT INTO ptnrtyperelation VALUES (@insertid, ?);',
			[type],
		);
	});

	const [result1] = await transaction.commit();
	mysqlConn.end();

	return { partnerID: `${result1.insertId}` };
};
