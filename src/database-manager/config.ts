import mysql from 'serverless-mysql';

const mysqlConn: mysql.ServerlessMysql = mysql({
	config: {
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PSWD,
	},
});

namespace ConfigDBManager {
	export const readAreas = async (): Promise<any[]> => {
		const query = 'SELECT * FROM area;';

		let result: any[];
		try {
			result = await mysqlConn.query<any>(query);
		} finally {
			mysqlConn.end();
		}

		return result;
	};

	export const readPartnerTypes = async (): Promise<any[]> => {
		const query = 'SELECT * FROM partnertype;';

		let result: any[];
		try {
			result = await mysqlConn.query<any>(query);
		} finally {
			mysqlConn.end();
		}

		return result;
	};
}

export default ConfigDBManager;
