import mysqlConn from '../util/mysql';
import {
	reviewImagesToReferences,
	partnerImagesToReferences,
} from '../util/image';

namespace UserService {
	export const createUser = async (
		sub: string,
		email: string,
		name: string,
		picture: string,
	) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query(
			'INSERT INTO user (sub, email, name, picture) VALUES (?, ?, ?, ?);',
			[sub, email, name, picture],
		);

		await transaction.commit();
		mysqlConn.end();
	};

	export const getUser = async (sub: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query(
			'SELECT id, email, name, picture FROM user WHERE sub=?;',
			[sub],
		);

		const [result1] = await transaction.commit();
		mysqlConn.end();

		if (result1.length !== 1) throw 'UserNotFound';

		return {
			id: `${result1[0].id}`,
			name: result1[0].name,
			email: result1[0].email,
			picture: result1[0].picture,
		};
	};

	export const getUserReviews = async (userID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query(
			`
			SELECT P.id partnerid, P.images partnerimages, P.name,
				R.id reviewid, R.rate, R.images reviewimages, R.content, R.created
			FROM review R
				JOIN partner P ON R.partnerid = P.id
			WHERE R.userid = ?;
			`,
			[userID],
		);

		const [result] = await transaction.commit();
		mysqlConn.end();

		return {
			reviews: result.map((row: any) => ({
				partner: {
					id: row.partnerid,
					name: row.name,
					image:
						partnerImagesToReferences(row.partnerid, row.partnerimages)[0] ||
						null,
				},
				review: {
					id: row.reviewid,
					rate: row.rate,
					images: reviewImagesToReferences(
						row.partnerid,
						row.reviewid,
						row.reviewimages,
					),
					content: row.content,
					created: row.created,
				},
			})),
		};
	};

	export const getUserQuestions = async (userID: string) => {
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
				id: row.id,
				title: row.title,
				answers: row.answers,
				keywords: row.keywords.split(','),
			})),
		};
	};

	export const getUserAnswers = async (userID: string) => {
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
				id: row.id,
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
}

export default UserService;
