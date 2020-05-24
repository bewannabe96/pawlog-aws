import mysqlConn from '../util/mysql';

namespace QnAService {
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
				SELECT Q.id, Q.title, Q.answers, U.id AS userid, U.email, U.name, U.picture
				FROM question AS Q
				JOIN user AS U ON Q.userid = U.id
				WHERE TRUE ${filterClause}
				GROUP BY Q.id
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
				title: row.title,
				answers: row.answers,
			})),
		};
	};
}

export default QnAService;
