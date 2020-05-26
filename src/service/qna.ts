import mysqlConn from '../util/mysql';

namespace QnAService {
	export const createQuestion = async (
		userID: string,
		category: string,
		freeCategory: string | null,
		pettype: string | null,
		title: string,
		content: string,
	) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query(
			`
			INSERT INTO question (userid, category, etccategory, pettype, title, content)
				VALUES (?, ?, ?, ?, ?, ?);
			`,
			[userID, category, freeCategory, pettype, title, content],
		);

		const [result1] = await transaction.commit();
		mysqlConn.end();

		return { questionID: `${result1.insertId}` };
	};

	export const getQuestions = async (
		limit: number,
		offset: number,
		filter: { query?: string; category?: string; pettype?: string },
	) => {
		let filterClause = '';
		const filterValues = [];

		if (filter.query) {
			filterClause +=
				'AND MATCH(title, content) AGAINST (? IN NATURAL LANGUAGE MODE)';
			filterValues.push(filter.query);
		}
		if (filter.category) {
			filterClause += 'AND category=?';
			filterValues.push(filter.category);
		}
		if (filter.pettype) {
			filterClause += 'AND pettype=?';
			filterValues.push(filter.pettype);
		}

		let transaction = mysqlConn.transaction();

		transaction
			.query(
				`
				SELECT count(*) AS total
				FROM question AS Q
				JOIN user AS U ON Q.userid = U.id
				WHERE TRUE ${filterClause};
				`,
				[...filterValues],
			)
			.query(
				`
				SELECT Q.id, Q.category, Q.pettype, Q.title, Q.answers, U.id AS userid, U.email, U.name, U.picture
				FROM question AS Q
				JOIN user AS U ON Q.userid = U.id
				WHERE TRUE ${filterClause}
				LIMIT ?, ?;
				`,
				[...filterValues, offset * limit, limit],
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
				category: {
					code: row.category,
					free: row.etccategory,
				},
				pettype: row.pettype,
				title: row.title,
				answers: row.answers,
			})),
		};
	};

	export const getQuestionDetail = async (questionID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query(
			`
				SELECT Q.id, Q.category, Q.etccategory, Q.pettype, Q.title, Q.content, Q.answers, Q.created, Q.updated,
					U.id AS userid, U.email, U.name, U.picture
				FROM question AS Q
				JOIN user AS U ON Q.userid = U.id
				WHERE Q.id=?;
				`,
			[questionID],
		);

		const [result1] = await transaction.commit();
		mysqlConn.end();

		return {
			id: questionID,
			user: {
				id: result1[0].userid,
				name: result1[0].name,
				email: result1[0].email,
				picture: result1[0].picture,
			},
			category: {
				code: result1[0].category,
				free: result1[0].etccategory,
			},
			pettype: result1[0].pettype,
			title: result1[0].title,
			content: result1[0].content,
			answers: result1[0].answers,
			created: result1[0].created,
			updated: result1[0].updated,
		};
	};

	export const deleteQuestion = async (questionID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('DELETE FROM answer WHERE questionid=?;', [questionID])
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
					P.images, P.name AS partnername, P.areacode, P.rate, P.reviews, P.googlerate, P.googlereviews,
					U.id AS userid, U.email, U.name AS username, U.picture
				FROM answer AS A
				JOIN user AS U ON A.userid = U.id
				JOIN partner AS P ON A.refpartner = P.id
				WHERE questionid=?
				ORDER BY created DESC;
				`,
			[questionID],
		);

		const [result1] = await transaction.commit();
		mysqlConn.end();

		return {
			answers: result1.map((row: any) => {
				const imageUID = row.images.split(':')[0];

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
					refPartner: {
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
								(row.rate * row.reviews + row.googlerate * row.googlereviews) /
								(row.reviews + row.googlereviews),
							count: row.reviews + row.googlereviews,
						},
					},
					created: row.created,
				};
			}),
		};
	};

	export const createAnswer = async (
		userID: string,
		questionID: string,
		content: string,
		refPartnerID: string | null,
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
