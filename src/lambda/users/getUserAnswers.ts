import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async (event) => {
	const userID = event.pathParameters.userID;

	try {
		const result = await _getUserAnswers(userID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		switch (error) {
			default:
				return createResponse(500, error);
		}
	}
};

const _getUserAnswers = async (userID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction.query(
		`
        SELECT A.id, A.content, A.questionid,
            Q.title, Q.answers, S.keywords,
            U.id userid, U.name, U.email, U.picture
        FROM answer A
            JOIN user U ON A.userid = U.id
            JOIN question Q ON A.questionid = Q.id
            JOIN (
                SELECT Q.id, GROUP_CONCAT(KR.keyword) keywords
                FROM question Q
                    JOIN qstnkwrelation KR ON Q.id = KR.questionid
                GROUP BY Q.id 
            ) S ON A.questionid = S.id
        WHERE A.userid = ?;
        `,
		[userID],
	);

	const [result] = await transaction.commit();
	mysqlConn.end();

	return {
		answers: result.map((row: any) => ({
			id: `${row.id}`,
			user: {
				id: `${row.userid}`,
				name: row.name,
				email: row.email,
				picture: row.picture,
			},
			question: {
				id: `${row.questionid}`,
				title: row.title,
				answers: row.answers,
				keywords: row.keywords.split(','),
			},
		})),
	};
};
