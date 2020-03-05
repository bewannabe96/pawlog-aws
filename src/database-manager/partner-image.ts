import mysql from 'serverless-mysql';

const mysqlConn: mysql.ServerlessMysql = mysql({
	config: {
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PSWD,
	},
});

namespace PartnerImageDBManager {
	export const readImages = async (partnerID: string): Promise<string[]> => {
		let transaction: mysql.Transaction = mysqlConn.transaction();

		transaction = transaction.query(
			'SELECT identifier FROM partnerimage WHERE partnerid=?;',
			[partnerID],
		);

		let result: any;
		try {
			result = await transaction.commit();
		} finally {
			mysqlConn.end();
		}

		return result[0].map((packet: any) => packet.identifier);
	};

	export const updateImages = async (
		partnerID: string,
		images: string[],
	): Promise<void> => {
		let transaction: mysql.Transaction = mysqlConn.transaction();

		transaction = transaction.query(
			'DELETE FROM partnerimage WHERE partnerid=?;',
			[partnerID],
		);

		images.forEach(image => {
			transaction = transaction.query(
				'INSERT INTO partnerimage (partnerid, identifier) VALUES (?, ?);',
				[partnerID, image],
			);
		});

		try {
			await transaction.commit();
		} finally {
			mysqlConn.end();
		}
	};
}

export default PartnerImageDBManager;
