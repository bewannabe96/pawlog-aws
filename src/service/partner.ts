import mysqlConn from '../util/mysql';
import {
	partnerImagesToReferences,
	reviewImagesToReferences,
} from '../util/image';

import { Location, Contact, OperatingHours, Review } from '../model';

namespace PartnerService {
	export const createPartner = async (name: string, types: number[]) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('INSERT INTO partner (name) VALUES (?);', [name])
			.query('SELECT LAST_INSERT_ID() INTO @insertid;');

		types.forEach((type) => {
			transaction = transaction.query(
				'INSERT INTO ptnrtyperelation VALUES (@insertid, ?);',
				[type],
			);
		});

		const [result1] = await transaction.commit();
		mysqlConn.end();

		return { partnerID: `${result1.insertId}` };
	};

	export const getPartners = async (
		limit: number,
		offset: number,
		filter: { query?: string; type?: string; area?: string },
	) => {
		let filterClause = '';
		const filterValues = [];

		if (filter.query) {
			filterClause += 'AND P.name LIKE ?';
			filterValues.push(`%${filter.query}%`);
		}
		if (filter.type) {
			filterClause += 'AND T.types LIKE ?';
			filterValues.push(`%${filter.type}%`);
		}
		if (filter.area) {
			filterClause += 'AND L.areacode = ?';
			filterValues.push(filter.area);
		}

		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query(
				`
				SELECT COUNT(*) total
					FROM partner P
					JOIN (
						SELECT R.partnerid, GROUP_CONCAT(R.partnertypecode) types
							FROM ptnrtyperelation R
							GROUP BY R.partnerid
					) T ON P.id = T.partnerid 
					LEFT JOIN partnerlocation L ON P.id = L.partnerid
					WHERE TRUE ${filterClause};
				`,
				filterValues,
			)
			.query(
				`
				SELECT P.id, P.images, P.name, P.ratesum, P.reviews, P.googleratesum, P.googlereviews, T.types, L.areacode
					FROM partner P
					JOIN (
						SELECT R.partnerid, GROUP_CONCAT(R.partnertypecode) types
							FROM ptnrtyperelation R
							GROUP BY R.partnerid
					) T ON P.id = T.partnerid 
					LEFT JOIN partnerlocation L ON P.id = L.partnerid
					WHERE TRUE ${filterClause}
					LIMIT ?, ?;
				`,
				[...filterValues, offset * limit, limit],
			);

		const [result1, result2] = await transaction.commit();
		mysqlConn.end();

		return {
			total: result1[0].total,
			partners: result2.map((row: any) => ({
				id: row.id.toString(),
				image: partnerImagesToReferences(row.id, row.images)[0] || null,
				name: row.name,
				types: row.types.split(','),
				areacode: row.areacode,
				review: {
					averageRate:
						(row.ratesum + row.googleratesum) /
							(row.reviews + row.googlereviews) || 0,
					count: row.reviews + row.googlereviews,
				},
			})),
		};
	};

	export const getPartnerDetail = async (partnerID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query(
				`
				SELECT id, name, ratesum, reviews, googleratesum, googlereviews, registered, updated
					FROM partner
					WHERE id = ?;
				`,
				[partnerID],
			)
			.query(
				'SELECT partnertypecode FROM ptnrtyperelation WHERE partnerid = ?;',
				[partnerID],
			)
			.query(
				'SELECT areacode, address, lat, lng FROM partnerlocation WHERE partnerid = ?;',
				[partnerID],
			)
			.query(
				'SELECT email, phone, website FROM partnercontact WHERE partnerid = ?;',
				[partnerID],
			)
			.query(
				'SELECT monoh, tueoh, wedoh, thuoh, frioh, satoh, sunoh, phoh FROM partneroh WHERE partnerid = ?;',
				[partnerID],
			);

		const [
			result1,
			result2,
			result3,
			result4,
			result5,
		] = await transaction.commit();
		mysqlConn.end();

		return {
			id: partnerID,
			name: result1[0].name,
			types: result2.map((row: any) => row.partnertypecode),
			review: {
				averageRate:
					(result1[0].ratesum + result1[0].googleratesum) /
						(result1[0].reviews + result1[0].googlereviews) || 0,
				count: result1[0].reviews + result1[0].googlereviews,
			},
			registered: result1[0].registered,
			updated: result1[0].updated,
			location: result3[0]
				? {
						areacode: result3[0].areacode,
						address: result3[0].address,
						lat: result3[0].lat,
						lng: result3[0].lng,
				  }
				: null,
			contact: result4[0]
				? {
						email: result4[0].email,
						phone: result4[0].phone,
						website: result4[0].website,
				  }
				: null,
			operatingHours: result5[0]
				? {
						mon: result5[0].monoh,
						tue: result5[0].tueoh,
						wed: result5[0].wedoh,
						thu: result5[0].thuoh,
						fri: result5[0].frioh,
						sat: result5[0].satoh,
						sun: result5[0].sunoh,
						ph: result5[0].phoh,
				  }
				: null,
		};
	};

	export const updatePartnerDetail = async (
		partnerID: string,
		name: string,
		types: string[],
		detail: {
			location?: Location;
			contact?: Contact;
			operatingHours?: OperatingHours;
		},
	) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('UPDATE partner SET name=?, updated=NOW() WHERE id=?;', [
				name,
				partnerID,
			])
			.query('DELETE FROM ptnrtyperelation WHERE partnerid=?;', [partnerID]);

		types.forEach((type) => {
			transaction = transaction.query(
				'INSERT INTO ptnrtyperelation VALUES (?, ?);',
				[partnerID, type],
			);
		});

		transaction = transaction.query(
			'DELETE FROM partnerlocation WHERE partnerid=?;',
			[partnerID],
		);
		if (detail.location) {
			transaction = transaction.query(
				'INSERT INTO partnerlocation (partnerid, areacode, address, lat, lng) VALUES (?, ?, ?, ?, ?);',
				[
					partnerID,
					detail.location.areacode,
					detail.location.address,
					detail.location.lat,
					detail.location.lng,
				],
			);
		}

		transaction = transaction.query(
			'DELETE FROM partnercontact WHERE partnerid=?;',
			[partnerID],
		);
		if (detail.contact) {
			transaction = transaction.query(
				'INSERT INTO partnercontact (partnerid, email, phone, website) VALUES (?, ?, ?, ?);',
				[
					partnerID,
					detail.contact.email,
					detail.contact.phone,
					detail.contact.website,
				],
			);
		}

		transaction = transaction.query(
			'DELETE FROM partneroh WHERE partnerid=?;',
			[partnerID],
		);
		if (detail.operatingHours) {
			transaction = transaction.query(
				'INSERT INTO partneroh (partnerid, monoh, tueoh, wedoh, thuoh, frioh, satoh, sunoh, phoh) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
				[
					partnerID,
					detail.operatingHours.mon,
					detail.operatingHours.tue,
					detail.operatingHours.wed,
					detail.operatingHours.thu,
					detail.operatingHours.fri,
					detail.operatingHours.sat,
					detail.operatingHours.sun,
					detail.operatingHours.ph,
				],
			);
		}

		await transaction.commit();
		mysqlConn.end();

		return { partnerID: partnerID };
	};

	export const deletePartner = async (partnerID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('DELETE FROM review WHERE partnerid=?;', [partnerID])
			.query('DELETE FROM googlereview WHERE partnerid=?;', [partnerID])
			.query('UPDATE answer SET refpartner=null WHERE refpartner=?;', [
				partnerID,
			])
			.query('DELETE FROM ptnrtyperelation WHERE partnerid=?;', [partnerID])
			.query('DELETE FROM partnerlocation WHERE partnerid=?;', [partnerID])
			.query('DELETE FROM partnercontact WHERE partnerid=?;', [partnerID])
			.query('DELETE FROM partneroh WHERE partnerid=?;', [partnerID])
			.query('DELETE FROM partner WHERE id=?;', [partnerID]);

		await transaction.commit();
		mysqlConn.end();

		return { partnerID: partnerID };
	};

	export const getPartnerImages = async (partnerID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query('SELECT images FROM partner WHERE id=?;', [
			partnerID,
		]);

		const [result1] = await transaction.commit();
		mysqlConn.end();

		return {
			images: partnerImagesToReferences(partnerID, result1[0].images),
		};
	};

	export const updatePartnerImages = async (
		partnerID: string,
		uids: string[],
	) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction.query(
			'UPDATE partner SET images=?, updated=NOW() WHERE id=?;',
			[uids.join(':'), partnerID],
		);

		await transaction.commit();
		mysqlConn.end();

		return {
			images: partnerImagesToReferences(partnerID, uids.join(':')),
		};
	};

	export const getPartnerReviews = async (
		partnerID: string,
		limit: number,
		offset: number,
	) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('SELECT count(id) total FROM review;')
			.query(
				`
				SELECT U.id userid, U.email, U.name, U.picture, R.id reviewid, R.rate, R.images, R.content, R.created
				FROM review R
				JOIN user U
				WHERE U.id=R.userid && partnerid=?
				ORDER BY created DESC
				LIMIT ?, ?;
				`,
				[partnerID, offset * limit, limit],
			);

		const [result1, result2] = await transaction.commit();
		mysqlConn.end();

		return {
			total: result1[0].total,
			reviews: result2.map((row: any) => ({
				user: {
					id: `${row.userid}`,
					name: row.name,
					email: row.email,
					picture: row.picture,
				},
				reviewID: row.reviewid,
				review: {
					rate: row.rate,
					images: reviewImagesToReferences(partnerID, row.reviewid, row.images),
					content: row.content,
				},
				created: row.created,
			})),
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
				'UPDATE partner SET ratesum=ratesum+?, reviews=reviews+1 WHERE id=?;',
				[review.rate, partnerID],
			);

		const [result1] = await transaction.commit();
		mysqlConn.end();

		return {
			reviewID: `${result1.insertId}`,
			review: review,
		};
	};

	export const deletePartnerReview = async (
		partnerID: string,
		reviewID: string,
	) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('SELECT rate INTO @rate FROM review WHERE id=?;', [reviewID])
			.query(
				`
				UPDATE partner SET
					ratesum=ratesum-@rate,
					reviews=reviews-1
				WHERE id=?;
				`,
				[partnerID],
			)
			.query('DELETE FROM review WHERE partnerid=? AND id=?', [
				partnerID,
				reviewID,
			]);

		await transaction.commit();
		mysqlConn.end();

		return { reviewID: reviewID };
	};

	export const addPartnerReviewImage = async (
		partnerID: string,
		reviewID: string,
		uid: string,
	) => {
		let transaction = mysqlConn.transaction();
		transaction = transaction.query('SELECT images FROM review WHERE id=?;', [
			reviewID,
		]);
		const [result1] = await transaction.commit();

		const uids: string[] =
			result1[0].images === '' ? [] : result1[0].images.split(':');
		if (uids.length >= 2) throw 'ImageCapacityFull';
		uids.push(uid);

		transaction = mysqlConn.transaction();
		transaction = transaction.query('UPDATE review SET images=? WHERE id=?;', [
			uids.join(':'),
			reviewID,
		]);
		await transaction.commit();

		mysqlConn.end();

		return reviewImagesToReferences(partnerID, reviewID, uid)[0];
	};

	export const getPartnerGoogleReviews = async (partnerID: string) => {
		let transaction = mysqlConn.transaction();

		transaction = transaction
			.query('SELECT count(id) total FROM googlereview;')
			.query(
				'SELECT id, name, photo, rate, content, created FROM googlereview WHERE partnerid=? ORDER BY created DESC;',
				[partnerID],
			);

		const [result1, result2] = await transaction.commit();
		mysqlConn.end();

		return {
			total: result1[0].total,
			reviews: result2.map((row: any) => {
				return {
					reviewID: row.id,
					name: row.name,
					photo: row.photo,
					review: {
						rate: row.rate,
						content: row.content,
					},
					created: row.created,
				};
			}),
		};
	};
}

export default PartnerService;
