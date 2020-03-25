import mysqlConn from '../util/mysql';

import { Location, Contact, OperatingHours, Review } from '../model';

namespace PartnerService {
	export const getPartners = async (limit: number, offset: number) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('SELECT count(id) AS total FROM partner;')
			.query(
				'SELECT P.id, P.name, P.areacode, P.rate, P.reviews, GROUP_CONCAT(R.partnertypecode) as types ' +
					'FROM partner AS P JOIN ptnrtyperelation AS R WHERE P.id=R.partnerid GROUP BY P.id LIMIT ?, ?;',
				[offset * limit, limit],
			);

		const [result1, result2] = await transaction.commit();
		mysqlConn.end();

		return {
			total: result1[0].total,
			partners: result2.map((row: any) => {
				return {
					id: row.id,
					name: row.name,
					types: row.types.split(',').map((t: any) => parseInt(t)),
					areacode: row.areacode,
					review: {
						averageRate: row.rate,
						count: row.reviews,
					},
				};
			}),
		};
	};

	export const createPartner = async (
		name: string,
		types: number[],
		areacode: number,
		location: Location,
	) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query(
				'INSERT INTO partner (name, areacode, address, lat, lng) VALUES (?, ?, ?, ?, ?);',
				[name, areacode, location.address, location.lat, location.lng],
			)
			.query('SELECT LAST_INSERT_ID() INTO @insertid;')
			.query('INSERT INTO partnerdetail (partnerid) VALUES (@insertid);');

		types.forEach(type => {
			transaction = transaction.query(
				'INSERT INTO ptnrtyperelation VALUES (@insertid, ?);',
				[type],
			);
		});

		const [result1] = await transaction.commit();
		mysqlConn.end();

		return { partnerID: `${result1.insertId}` };
	};

	export const getPartnerDetail = async (partnerID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query(
				'SELECT id, name, areacode, rate, reviews, address, lat, lng, registered, updated FROM partner WHERE id=?;',
				[partnerID],
			)
			.query(
				'SELECT partnertypecode FROM ptnrtyperelation WHERE partnerid=?;',
				[partnerID],
			)
			.query(
				'SELECT email, phone, monoh, tueoh, wedoh, thuoh, frioh, satoh, sunoh, phoh FROM partnerdetail WHERE partnerid=?;',
				[partnerID],
			);

		const [result1, result2, result3] = await transaction.commit();
		mysqlConn.end();

		return {
			id: partnerID,
			name: result1[0].name,
			types: result2.map((row: any) => row.partnertypecode),
			areacode: result1[0].areacode,
			location: {
				address: result1[0].address,
				lat: result1[0].lat,
				lng: result1[0].lng,
			},
			review: {
				averageRate: result1[0].rate,
				count: result1[0].reviews,
			},
			detail: {
				operatingHours: {
					mon: result3[0].monoh,
					tue: result3[0].tueoh,
					wed: result3[0].wedoh,
					thu: result3[0].thuoh,
					fri: result3[0].frioh,
					sat: result3[0].satoh,
					sun: result3[0].sunoh,
					ph: result3[0].phoh,
				},
				contact: {
					email: result3[0].email,
					phone: result3[0].phone,
				},
			},
			registered: result1[0].registered,
			updated: result1[0].updated,
		};
	};

	export const updatePartnerDetail = async (
		partnerID: string,
		name: string,
		types: number[],
		areacode: number,
		location: Location,
		operatingHours: OperatingHours,
		contact: Contact,
	) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query(
				'UPDATE partner SET name=?, areacode=?, address=?, lat=?, lng=?, updated=NOW() WHERE id=?;',
				[
					name,
					areacode,
					location.address,
					location.lat,
					location.lng,
					partnerID,
				],
			)
			.query(
				'UPDATE partnerdetail SET email=?, phone=?, monoh=?, tueoh=?, wedoh=?, thuoh=?, frioh=?, satoh=?, sunoh=?, phoh=? WHERE partnerid=?;',
				[
					contact.email,
					contact.phone,
					operatingHours.mon,
					operatingHours.tue,
					operatingHours.wed,
					operatingHours.thu,
					operatingHours.fri,
					operatingHours.sat,
					operatingHours.sun,
					operatingHours.ph,
					partnerID,
				],
			)
			.query('DELETE FROM ptnrtyperelation WHERE partnerid=?;', [partnerID]);

		types.forEach(t => {
			transaction = transaction.query(
				'INSERT INTO ptnrtyperelation VALUES (?, ?);',
				[partnerID, t],
			);
		});

		await transaction.commit();
		mysqlConn.end();

		return { partnerID: partnerID };
	};

	export const getPartnerImages = async (partnerID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query(
			'SELECT identifier FROM partnerimage WHERE partnerid=?;',
			[partnerID],
		);

		const [result1] = await transaction.commit();
		mysqlConn.end();

		return { images: result1.map((row: any) => row.identifier) };
	};

	export const updatePartnerImages = async (
		partnerID: string,
		images: string[],
	) => {
		let transaction = mysqlConn.transaction();

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

		await transaction.commit();
		mysqlConn.end();

		return { images: images };
	};

	export const getPartnerReviews = async (
		partnerID: string,
		limit: number,
		offset: number,
	) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('SELECT count(id) AS total FROM review;')
			.query(
				'SELECT U.id AS userid, U.email, U.name, U.picture, R.id AS reviewid, R.rate, R.content, R.created FROM review AS R JOIN user AS U WHERE U.id=R.userid && partnerid=? ORDER BY created DESC LIMIT ?, ?;',
				[partnerID, offset * limit, limit],
			);

		const [result1, result2] = await transaction.commit();
		mysqlConn.end();

		return {
			total: result1[0].total,
			reviews: result2.map((row: any) => {
				return {
					user: {
						id: row.userid,
						name: row.name,
						email: row.email,
						picture: row.picture,
					},
					reviewID: row.reviewid,
					review: {
						rate: row.rate,
						content: row.content,
					},
					created: row.created,
				};
			}),
		};
	};

	export const createPartnerReview = async (
		partnerID: string,
		userID: string,
		review: Review,
	) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query(
				'INSERT INTO review (partnerid, userid, rate, content) VALUES (?, ?, ?, ?);',
				[partnerID, userID, review.rate, review.content],
			)
			.query(
				'UPDATE partner SET rate=((rate*reviews)+?)/(reviews+1), reviews=reviews+1 WHERE id=?;',
				[review.rate, partnerID],
			);

		const [result1] = await transaction.commit();
		mysqlConn.end();

		return {
			reviewID: `${result1.insertId}`,
			review: review,
		};
	};
}

export default PartnerService;
