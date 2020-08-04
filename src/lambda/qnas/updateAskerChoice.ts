import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;

	const data = JSON.parse(event.body) as {
		answerID: string;
	};

	try {
		const result = await _updateAskerChoice(questionID, data.answerID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _updateAskerChoice = async (questionID: string, answerID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query(
			`
            DELETE FROM askerchoice WHERE questionid=?;
            `,
			[questionID],
		)
		.query(
			`
            INSERT INTO askerchoice (questionid, answerid) VALUES (?, ?);
            `,
			[questionID, answerID],
		);

	await transaction.commit();
	mysqlConn.end();

	return { answerID: answerID };
};
