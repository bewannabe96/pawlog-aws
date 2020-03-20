import mysql from 'serverless-mysql';

import Partner from '../model/partner';
import Review from '../model/review';

const mysqlConn: mysql.ServerlessMysql = mysql({
	config: {
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PSWD,
	},
});

namespace PartnerDBManager {
	export const readPartners = async (type: number, page: number) => {
		const perPage = 10;
		const offset = (page - 1) * perPage;

		let transaction: mysql.Transaction = mysqlConn.transaction();

		transaction =
			type > 0
				? transaction
						.query('SELECT count(id) AS total FROM partner WHERE type=?;', [
							type,
						])
						.query(
							'SELECT id, type, name, areacode, rate, reviews FROM partner WHERE type=? LIMIT ?, ?;',
							[type, offset, perPage],
						)
				: transaction
						.query('SELECT count(id) AS total FROM partner;', [])
						.query(
							'SELECT id, type, name, areacode, rate, reviews FROM partner LIMIT ?, ?;',
							[offset, perPage],
						);

		let result: any;
		try {
			result = await transaction.commit();
		} finally {
			mysqlConn.end();
		}

		const [result1, result2] = result;

		return {
			currentPage: page,
			maxPage: Math.ceil(result1[0].total / 10),
			partners: result2,
		};
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

	export const readPartner = async (partnerID: string): Promise<Partner> => {
		let transaction: mysql.Transaction = mysqlConn.transaction();

		transaction = transaction.query('SELECT * FROM partner WHERE id=?;', [
			partnerID,
		]);

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

		const [result1, result2] = result;

		return {
			id: result1[0].id,
			type: result1[0].type,
			name: result1[0].name,
			images: result2.map((row: any) => row.identifier),
			areacode: result1[0].areacode,
			rate: result1[0].rate,
			reviews: result1[0].reviews,
			location: {
				address: result1[0].address,
				lat: result1[0].lat,
				lng: result1[0].lng,
			},
			operatingHours: {
				mon: result1[0].monoh,
				tue: result1[0].tueoh,
				wed: result1[0].wedoh,
				thu: result1[0].thuoh,
				fri: result1[0].frioh,
				sat: result1[0].satoh,
				sun: result1[0].sunoh,
				ph: result1[0].phoh,
			},
			contact: {
				email: result1[0].email,
				phone: result1[0].phone,
			},
		};
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

	export const createReview = async (partnerID: string, review: Review) => {
		let transaction: mysql.Transaction = mysqlConn.transaction();

		transaction = transaction.query(
			'INSERT INTO review (partnerid, userid, rate, content) VALUES (?, ?, ?, ?);',
			[partnerID, review.userID, review.rate, review.content],
		);

		transaction = transaction.query(
			'UPDATE partner SET rate=((rate*reviews)+?)/(reviews+1), reviews=reviews+1 WHERE id=?;',
			[review.rate, partnerID],
		);

		let result: any;
		try {
			result = await transaction.commit();
		} finally {
			mysqlConn.end();
		}

		return {
			reviewID: result[0].insertId,
		};
	};

	export const readReviews = async (partnerID: string, page: number) => {
		const perPage = 10;
		const offset = (page - 1) * perPage;

		let transaction: mysql.Transaction = mysqlConn.transaction();

		transaction = transaction
			.query('SELECT count(id) AS total FROM review WHERE partnerid=?;', [
				partnerID,
			])
			.query(
				'SELECT id, userid, rate, content FROM review WHERE partnerid=? LIMIT ?, ?;',
				[partnerID, offset, perPage],
			);

		let result: any;
		try {
			result = await transaction.commit();
		} finally {
			mysqlConn.end();
		}

		const [result1, result2] = result;

		return {
			currentPage: page,
			maxPage: Math.ceil(result1[0].total / 10),
			partners: result2,
		};
	};
}

export default PartnerDBManager;
