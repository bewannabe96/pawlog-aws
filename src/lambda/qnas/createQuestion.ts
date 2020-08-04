import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async (event) => {
	const data = JSON.parse(event.body) as {
		userID: string;
		title: string;
		content: string;
		images: string[];
		keywords: string[];
	};

	try {
		const result = await _createQuestion(
			data.userID,
			data.title,
			data.content,
			data.images,
			data.keywords,
		);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _createQuestion = async (
	userID: string,
	title: string,
	content: string,
	images: string[],
	keywords: string[],
) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query(
			`
        INSERT INTO question (userid, title, content, images)
            VALUES (?, ?, ?, ?);
        `,
			[userID, title, content, images.join(':')],
		)
		.query('SELECT LAST_INSERT_ID() INTO @insertid;', []);

	keywords.forEach((keyword) => {
		transaction = transaction.query(
			'INSERT INTO qstnkwrelation (questionid, keyword) VALUES (@insertid, ?);',
			[keyword],
		);
	});

	const [result1] = await transaction.commit();
	mysqlConn.end();

	return { questionID: `${result1.insertId}` };
};
