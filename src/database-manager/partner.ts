import mysql from 'serverless-mysql';

import PartnerEntity from '../entity/partner';
import Partner from '../model/partner';

const mysqlConn: mysql.ServerlessMysql = mysql({
	config: {
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PSWD,
	},
});

namespace PartnerDBManager {
	export const countPartners = async (type: number): Promise<number> => {
		const query =
			type > 0
				? 'SELECT count(id) AS total FROM partner WHERE type=?;'
				: 'SELECT count(id) AS total FROM partner;';
		const queryValues = type > 0 ? [type] : [];

		let result: any;
		try {
			result = await mysqlConn.query<any>(query, queryValues);
		} finally {
			mysqlConn.end();
		}

		return result[0].total;
	};

	export const reatPartners = async (
		type: number,
		page: number,
	): Promise<Partner[]> => {
		const perPage = 10;
		const offset = (page - 1) * perPage;

		const query =
			type > 0
				? 'SELECT id, type, name, rate, areacode FROM partner WHERE type=? LIMIT ?, ?;'
				: 'SELECT id, type, name, rate, areacode FROM partner LIMIT ?, ?;';
		const queryValues = type > 0 ? [type, offset, perPage] : [offset, perPage];

		let result: any;
		try {
			result = await mysqlConn.query<any>(query, queryValues);
		} finally {
			mysqlConn.end();
		}

		return result;
	};

	export const createPartner = async (partner: Partner): Promise<string> => {
		const query =
			'INSERT INTO partner ' +
			'(type, name, areacode, address, lat, lng) ' +
			'VALUES (?, ?, ?, ?, ?, ?);';
		const queryValues = [
			partner.type,
			partner.name,
			partner.areacode,
			partner.location.address,
			partner.location.lat,
			partner.location.lng,
		];

		let result: any;
		try {
			result = await mysqlConn.query<any>(query, queryValues);
		} finally {
			mysqlConn.end();
		}

		return `${result.insertId}`;
	};

	export const readPartner = async (
		partnerID: string,
	): Promise<PartnerEntity> => {
		let transaction: mysql.Transaction = mysqlConn.transaction();

		transaction = transaction.query('SELECT * FROM partner WHERE id=?;', [
			partnerID,
		]);

		let result: any;
		try {
			result = await transaction.commit();
		} finally {
			mysqlConn.end();
		}

		return result[0][0] as PartnerEntity;
	};

	export const updatePartner = async (
		partnerID: string,
		partner: Partner,
	): Promise<void> => {
		const query =
			'UPDATE partner ' +
			'SET name=?, address=?, lat=?, lng=?, email=?, phone=?, ' +
			'monoh=?, tueoh=?, wedoh=?, thuoh=?, frioh=?, satoh=?, sunoh=?, phoh=? ' +
			'WHERE id=?;';
		const queryValues = [
			partner.name,
			partner.location.address,
			partner.location.lat,
			partner.location.lng,
			partner.contact.email,
			partner.contact.phone,
			partner.operatingHours.mon,
			partner.operatingHours.tue,
			partner.operatingHours.wed,
			partner.operatingHours.thu,
			partner.operatingHours.fri,
			partner.operatingHours.sat,
			partner.operatingHours.sun,
			partner.operatingHours.ph,
			partnerID,
		];

		try {
			await mysqlConn.query(query, queryValues);
		} finally {
			mysqlConn.end();
		}
	};
}

export default PartnerDBManager;
