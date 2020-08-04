import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import { questionImagesToReferences } from '../../util/image';

export const handler: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;

	try {
		const result = await _getQuestionDetail(questionID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _getQuestionDetail = async (questionID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query(
			`
            SELECT Q.id, Q.title, Q.content, Q.images, Q.answers, Q.created, Q.updated,
                SA.answerid askerchoice,
                U.id userid, U.email, U.name, U.picture
            FROM question Q
                JOIN user U ON Q.userid = U.id
                LEFT JOIN askerchoice SA ON Q.id = SA.questionid
            WHERE Q.id=?;
            `,
			[questionID],
		)
		.query(
			`
            SELECT keyword FROM qstnkwrelation WHERE questionid=?;
        `,
			[questionID],
		);

	const [result1, result2] = await transaction.commit();
	mysqlConn.end();

	return {
		id: questionID,
		user: {
			id: `${result1[0].userid}`,
			name: result1[0].name,
			email: result1[0].email,
			picture: result1[0].picture,
		},
		title: result1[0].title,
		content: result1[0].content,
		images: questionImagesToReferences(questionID, result1[0].images),
		answers: result1[0].answers,
		askerChoiceAnswer: result1[0].askerchoice
			? `${result1[0].askerchoice}`
			: result1[0].askerchoice,
		keywords: result2.map((row: any) => `${row.keyword}`),
		created: result1[0].created,
		updated: result1[0].updated,
	};
};
