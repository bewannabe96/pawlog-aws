import { APIGatewayProxyHandler } from 'aws-lambda';

import { Location, OperatingHours, Contact } from '../../model';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async (event) => {
	const partnerID = event.pathParameters.partnerID;
	const data = JSON.parse(event.body) as {
		name: string;
		types: string[];
		location?: Location;
		contact?: Contact;
		operatingHours?: OperatingHours;
	};

	try {
		const result = await _updatePartnerDetail(
			partnerID,
			data.name,
			data.types,
			{
				location: data.location,
				contact: data.contact,
				operatingHours: data.operatingHours,
			},
		);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _updatePartnerDetail = async (
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

	transaction = transaction.query('DELETE FROM partneroh WHERE partnerid=?;', [
		partnerID,
	]);
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
