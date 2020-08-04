import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;
	const answerID = event.pathParameters.answerID;

	try {
		const result = await _deleteAnswer(questionID, answerID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _deleteAnswer = async (questionID: string, answerID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query(
			`
            DELETE FROM answer WHERE id=? AND questionid=?;
            `,
			[answerID, questionID],
		)
		.query(
			`
            DELETE FROM askerchoice WHERE answerid=?;
            `,
			[answerID],
		)
		.query(
			`
            UPDATE question SET answers=answers-1 WHERE id=?; 
            `,
			[questionID],
		);

	await transaction.commit();
	mysqlConn.end();

	return { answerID: answerID };
};
