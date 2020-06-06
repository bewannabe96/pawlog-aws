import mysqlConn from '../util/mysql';

namespace ConfigService {
	export const getAreas = async () => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query('SELECT code, name FROM area;');

		const [result] = await transaction.commit();
		mysqlConn.end();

		return result;
	};

	export const getPartnerTypes = async () => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query('SELECT code, name FROM partnertype;');

		const [result] = await transaction.commit();
		mysqlConn.end();

		return result;
	};

	export const getQuestionKewords = async () => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query(
			'SELECT K.code, G.name groupname, K.name FROM qstnkeyword K JOIN qstnkwgroup G ON G.code = K.group;',
		);

		const [result] = await transaction.commit();
		mysqlConn.end();

		return result.map((row: any) => ({
			...row,
			group: row.groupname,
		}));
	};
}

export default ConfigService;
