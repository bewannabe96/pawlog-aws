import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';

export const handler: APIGatewayProxyHandler = async (event) => {
	const partnerID = event.pathParameters.partnerID;

	try {
		const result = await _getPartnerDetail(partnerID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _getPartnerDetail = async (partnerID: string) => {
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
