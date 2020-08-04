import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async (event) => {
	const userID = event.pathParameters.userID;

	try {
		const result = await _getUserQuestions(userID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		switch (error) {
			default:
				return createResponse(500, error);
		}
	}
};

const _getUserQuestions = async (userID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction.query(
		`
        SELECT Q.id, Q.title, Q.answers, GROUP_CONCAT(KR.keyword) keywords
        FROM question Q
            JOIN qstnkwrelation KR ON Q.id = KR.questionid
        WHERE Q.userid = ?
        GROUP BY Q.id;
        `,
		[userID],
	);

	const [result] = await transaction.commit();
	mysqlConn.end();

	return {
		questions: result.map((row: any) => ({
			id: `${row.id}`,
			title: row.title,
			answers: row.answers,
			keywords: row.keywords.split(','),
		})),
	};
};
