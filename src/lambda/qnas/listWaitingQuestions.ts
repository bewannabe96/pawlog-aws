import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const listWaitingQuestions: APIGatewayProxyHandler = async (event) => {
	event.queryStringParameters = event.queryStringParameters || {};

	const limit = event.queryStringParameters.limit ?? '10';
	const offset = event.queryStringParameters.offset ?? '0';

	try {
		const result = await _getWaitingQuestions(
			parseInt(limit),
			parseInt(offset),
		);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _getWaitingQuestions = async (limit: number, offset: number) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query(
			`
            SELECT COUNT(Q.id) total
            FROM question Q
            WHERE answers = 0;
            `,
		)
		.query(
			`
            SELECT Q.id, Q.title, Q.answers, U.id userid, U.email, U.name, U.picture, K.keywords
            FROM question Q
                JOIN user U ON Q.userid = U.id
                JOIN (
                    SELECT Q.id, GROUP_CONCAT(KR.keyword) keywords
                    FROM question Q
                        JOIN qstnkwrelation KR ON Q.id = KR.questionid
                    GROUP BY Q.id
                ) K ON K.id = Q.id
            WHERE Q.answers = 0
            ORDER BY Q.created DESC
            LIMIT ?, ?;
            `,
			[offset * limit, limit],
		);

	const [result1, result2] = await transaction.commit();
	mysqlConn.end();

	return {
		total: result1[0].total,
		qnas: result2.map((row: any) => ({
			id: row.id.toString(),
			user: {
				id: row.userid,
				name: row.name,
				email: row.email,
				picture: row.picture,
			},
			title: row.title,
			answers: row.answers,
			keywords: row.keywords.split(','),
		})),
	};
};
