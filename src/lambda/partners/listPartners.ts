import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../../util/response';
import mysqlConn from '../../util/mysql';
import { partnerImagesToReferences } from '../../util/image';
import { isCurrentlyOpened } from '../../util/operating-hours';

export const handler: APIGatewayProxyHandler = async (event) => {
	event.queryStringParameters = event.queryStringParameters || {};

	const limit = event.queryStringParameters.limit ?? '10';
	const offset = event.queryStringParameters.offset ?? '0';

	const query = event.queryStringParameters.q;
	const type = event.queryStringParameters.type;
	const area = event.queryStringParameters.area;

	try {
		const result = await _getPartners(parseInt(limit), parseInt(offset), {
			query,
			type,
			area,
		});
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

const _getPartners = async (
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
            SELECT P.id, P.images, P.name, P.ratesum, P.reviews, P.googleratesum, P.googlereviews, T.types, L.areacode,
                PO.monoh, PO.tueoh, PO.wedoh, PO.thuoh, PO.frioh, PO.satoh, PO.sunoh
            FROM partner P
            JOIN (
                SELECT R.partnerid, GROUP_CONCAT(R.partnertypecode) types
                    FROM ptnrtyperelation R
                    GROUP BY R.partnerid
            ) T ON P.id = T.partnerid 
            LEFT JOIN partnerlocation L ON P.id = L.partnerid
            LEFT JOIN partneroh PO ON P.id = PO.partnerid
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
			opened: isCurrentlyOpened([
				row.sunoh,
				row.monoh,
				row.tueoh,
				row.wedoh,
				row.thuoh,
				row.frioh,
				row.satoh,
			]),
		})),
	};
};
