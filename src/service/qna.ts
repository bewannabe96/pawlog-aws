import mysqlConn from '../util/mysql';

namespace QnAService {
	export const createQuestion = async (
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

	export const getQuestions = async (
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

	export const getWaitingQuestions = async (limit: number, offset: number) => {
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

	export const getQuestionDetail = async (questionID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query(
				`
				SELECT Q.id, Q.title, Q.content, Q.images, Q.answers, Q.created, Q.updated,
					U.id userid, U.email, U.name, U.picture
				FROM question Q
					JOIN user U ON Q.userid = U.id
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

		const uids = result1[0].images === '' ? [] : result1[0].images.split(':');

		return {
			id: questionID,
			user: {
				id: result1[0].userid,
				name: result1[0].name,
				email: result1[0].email,
				picture: result1[0].picture,
			},
			title: result1[0].title,
			content: result1[0].content,
			images: uids.map((uid: any) => ({
				uid: uid,
				url: `https://${process.env.QNA_IMAGE_BUCKET_DOMAIN}/${questionID}/${uid}`,
			})),
			answers: result1[0].answers,
			keywords: result2.map((row: any) => row.keyword),
			created: result1[0].created,
			updated: result1[0].updated,
		};
	};

	export const deleteQuestion = async (questionID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('DELETE FROM answer WHERE questionid=?;', [questionID])
			.query('DELETE FROM qstnkwrelation WHERE questionid=?;', [questionID])
			.query('DELETE FROM question WHERE id=?;', [questionID]);

		await transaction.commit();
		mysqlConn.end();

		return { questionID: questionID };
	};

	export const getAnswers = async (questionID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query(
			`
			SELECT A.id, A.content, A.selected, A.refpartner, A.created,
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
			answers: result1.map((row: any) => {
				const imageUID = row.images?.split(':')[0];

				return {
					user: {
						id: row.userid,
						name: row.username,
						email: row.email,
						picture: row.picture,
					},
					answerID: row.id,
					content: row.content,
					selected: row.selected === 1,
					refPartner: row.refpartner
						? {
								id: row.refpartner,
								image:
									imageUID === ''
										? null
										: {
												uid: imageUID,
												url: `https://${process.env.PARTNER_IMAGE_BUCKET_DOMAIN}/${row.id}/${imageUID}`,
										  },
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
				};
			}),
		};
	};

	export const createAnswer = async (
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
			.query(
				`
			UPDATE question SET answers=answers+1 WHERE id=?; 
			`,
				[questionID],
			);

		const [result1] = await transaction.commit();
		mysqlConn.end();

		return { answerID: `${result1.insertId}` };
	};

	export const deleteAnswer = async (questionID: string, answerID: string) => {
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
			UPDATE question SET answers=answers-1 WHERE id=?; 
			`,
				[questionID],
			);

		await transaction.commit();
		mysqlConn.end();

		return { answerID: answerID };
	};
}

export default QnAService;
