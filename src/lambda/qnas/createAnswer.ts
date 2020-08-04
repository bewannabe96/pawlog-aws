import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import { partnerImagesToReferences } from '../../util/image';

export const handler: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;

	const data = JSON.parse(event.body) as {
		userID: string;
		content: string;
		refPartnerID?: string;
	};

	try {
		const result = await _createAnswer(
			data.userID,
			questionID,
			data.content,
			data.refPartnerID,
		);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _createAnswer = async (
	userID: string,
	questionID: string,
	content: string,
	refPartnerID?: string,
) => {
	let transaction = mysqlConn.transaction();

	transaction = transaction
		.query(
			`
            INSERT INTO answer (questionid, userid, content, refpartner)
                VALUES (?, ?, ?, ?);
            `,
			[questionID, userID, content, refPartnerID],
		)
		.query('SELECT LAST_INSERT_ID() INTO @insertid;')
		.query(
			`
            UPDATE question SET answers=answers+1 WHERE id=?; 
            `,
			[questionID],
		)
		.query(
			`
            SELECT A.id, A.content, A.refpartner, A.created,
                U.id userid, U.email, U.name username, U.picture,
                P.images, P.name partnername, P.ratesum, P.reviews, P.googleratesum, P.googlereviews, PL.areacode
            FROM answer A
            JOIN user U ON A.userid = U.id
            LEFT JOIN partner P ON A.refpartner = P.id
            LEFT JOIN partnerlocation PL ON A.refpartner = PL.partnerid
            WHERE A.id=@insertid;
            `,
		);

	const result4 = (await transaction.commit())[3];
	mysqlConn.end();

	return {
		user: {
			id: `${result4[0].userid}`,
			name: result4[0].username,
			email: result4[0].email,
			picture: result4[0].picture,
		},
		answerID: `${result4[0].id}`,
		content: result4[0].content,
		refPartner: result4[0].refpartner
			? {
					id: result4[0].refpartner,
					image:
						partnerImagesToReferences(result4[0].id, result4[0].images)[0] ||
						null,
					name: result4[0].partnername,
					areacode: result4[0].areacode,
					review: {
						averageRate:
							(result4[0].ratesum + result4[0].googleratesum) /
								(result4[0].reviews + result4[0].googlereviews) || 0,
						count: result4[0].reviews + result4[0].googlereviews,
					},
			  }
			: null,
		created: result4[0].created,
	};
};
