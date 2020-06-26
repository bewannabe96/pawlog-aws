import mysqlConn from '../util/mysql';

namespace ConfigService {
	export const getAreas = async () => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('SELECT code, name FROM areagroup;')
			.query('SELECT code, groupcode, name FROM area;');

		const [result1, result2] = await transaction.commit();
		mysqlConn.end();

		return {
			groups: result1.map((row: any) => ({
				code: row.code,
				name: row.name,
			})),
			areas: result2.map((row: any) => ({
				code: row.code,
				group: row.groupcode,
				name: row.name,
			})),
		};
	};

	export const getPartnerTypes = async () => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query('SELECT code, name FROM partnertype;');

		const [result] = await transaction.commit();
		mysqlConn.end();

		return {
			partnerTypes: result.map((row: any) => ({
				code: row.code,
				name: row.name,
			})),
		};
	};

	export const getQuestionKewords = async () => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('SELECT code, name FROM qstnkwgroup;')
			.query('SELECT code, groupcode, name FROM qstnkeyword;');

		const [result1, result2] = await transaction.commit();
		mysqlConn.end();

		return {
			groups: result1.map((row: any) => ({
				code: row.code,
				name: row.name,
			})),
			keywords: result2.map((row: any) => ({
				code: row.code,
				group: row.groupcode,
				name: row.name,
			})),
		};
	};
}

export default ConfigService;
