import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async (event) => {
	event.queryStringParameters = event.queryStringParameters || {};

	const limit = event.queryStringParameters.limit ?? '10';
	const offset = event.queryStringParameters.offset ?? '0';

	const query = event.queryStringParameters.q;
	const keywords = event.queryStringParameters.keywords?.split(',');

	try {
		const result = await _getQuestions(parseInt(limit), parseInt(offset), {
			query,
			keywords,
		});
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _getQuestions = async (
	limit: number,
	offset: number,
	filter: { query?: string; keywords?: string[] },
) => {
	let transaction = mysqlConn.transaction();

	transaction
		.query(
			`
            SELECT COUNT(Q.id) total
            FROM question Q
                ${
									filter.keywords
										? `
                    JOIN (
                        SELECT Q.id
                        FROM question Q
                            JOIN qstnkwrelation KR ON Q.id = KR.questionid
                        WHERE KR.keyword IN (?)
                        GROUP BY Q.id
                    ) S ON S.id = Q.id
                    `
										: ''
								}
            WHERE TRUE
            ${
							filter.query
								? 'AND MATCH(title, content) AGAINST (? IN NATURAL LANGUAGE MODE)'
								: ''
						}
            ;
            `,
			[
				...(filter.keywords ? [filter.keywords] : []),
				...(filter.query ? [filter.query] : []),
			],
		)
		.query(
			`
            SELECT Q.id, Q.title, Q.answers, U.id userid, U.email, U.name, U.picture, K.keywords
            FROM question Q
                JOIN user U ON Q.userid = U.id
                ${
									filter.keywords
										? `
                    JOIN (
                        SELECT Q.id, COUNT(KR.keyword) score
                        FROM question Q
                            JOIN qstnkwrelation KR ON Q.id = KR.questionid
                        WHERE KR.keyword IN (?)
                        GROUP BY Q.id
                    ) S ON S.id = Q.id
                    `
										: ''
								}
                JOIN (
                    SELECT Q.id, GROUP_CONCAT(KR.keyword) keywords
                    FROM question Q
                        JOIN qstnkwrelation KR ON Q.id = KR.questionid
                    GROUP BY Q.id
                ) K ON K.id = Q.id
            WHERE TRUE
            ${
							filter.query
								? 'AND MATCH(title, content) AGAINST (? IN NATURAL LANGUAGE MODE)'
								: ''
						}
            ${filter.keywords ? 'ORDER BY S.score DESC' : ''}
            LIMIT ?, ?;
            `,
			[
				...(filter.keywords ? [filter.keywords] : []),
				...(filter.query ? [filter.query] : []),
				offset * limit,
				limit,
			],
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
