import mysqlConn from '../util/mysql';

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

		if (result1.length == 1)
			return {
				id: `${result1[0].id}`,
				name: result1[0].name,
				email: result1[0].email,
				picture: result1[0].picture,
			};
	};
}

export default UserService;
