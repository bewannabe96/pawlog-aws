import mysql from 'serverless-mysql';

const mysqlConn: mysql.ServerlessMysql = mysql({
	config: {
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PSWD,
	},
});

export default mysqlConn;
