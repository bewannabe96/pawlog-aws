export const createResponse = (statusCode: number, message: any) => {
	return { statusCode: statusCode, body: JSON.stringify(message) };
};
