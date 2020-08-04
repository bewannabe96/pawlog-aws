import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import { partnerImagesToReferences } from '../../util/image';

export const handler: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;

	try {
		const result = await _getAnswers(questionID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _getAnswers = async (questionID: string) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction.query(
		`
        SELECT A.id, A.content, A.refpartner, A.created,
            U.id userid, U.email, U.name username, U.picture,
            P.images, P.name partnername, P.ratesum, P.reviews, P.googleratesum, P.googlereviews, PL.areacode
        FROM answer A
        JOIN user U ON A.userid = U.id
        LEFT JOIN partner P ON A.refpartner = P.id
        LEFT JOIN partnerlocation PL ON A.refpartner = PL.partnerid
        WHERE questionid=?;
            `,
		[questionID],
	);

	const [result1] = await transaction.commit();
	mysqlConn.end();

	return {
		answers: result1.map((row: any) => ({
			user: {
				id: `${row.userid}`,
				name: row.username,
				email: row.email,
				picture: row.picture,
			},
			answerID: `${row.id}`,
			content: row.content,
			refPartner: row.refpartner
				? {
						id: row.refpartner,
						image:
							partnerImagesToReferences(row.refpartner, row.images)[0] || null,
						name: row.partnername,
						areacode: row.areacode,
						review: {
							averageRate:
								(row.ratesum + row.googleratesum) /
									(row.reviews + row.googlereviews) || 0,
							count: row.reviews + row.googlereviews,
						},
				  }
				: null,
			created: row.created,
		})),
	};
};
