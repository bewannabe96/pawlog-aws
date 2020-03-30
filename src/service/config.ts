import mysqlConn from '../util/mysql';

namespace ConfigService {
	export const getAreas = async () => {
		const query = 'SELECT code, name FROM area;';

		const result = await mysqlConn.query(query);
		mysqlConn.end();

		return result;
	};

	export const getPartnerTypes = async () => {
		const query = 'SELECT code, name FROM partnertype;';

		const result = await mysqlConn.query(query);
		mysqlConn.end();

		return result;
	};
}

export default ConfigService;