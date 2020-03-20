import mysql from 'serverless-mysql';

const mysqlConn: mysql.ServerlessMysql = mysql({
	config: {
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PSWD,
	},
});

namespace UserDBManager {
	export const readUser = async (sub: string) => {
		let result: any[];
		try {
			result = await mysqlConn.query<any>(
				'SELECT id, email, name, picture FROM user WHERE sub=?;',
				[sub],
			);
		} finally {
			mysqlConn.end();
		}

		return result[0];
	};
}

export default UserDBManager;
