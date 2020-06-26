import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../util/response';

import QnAService from '../service/qna';
import QnAImageService from '../service/qna-image';

// listQuestions
export const listQuestions: APIGatewayProxyHandler = async (event) => {
	event.queryStringParameters = event.queryStringParameters || {};

	const limit = event.queryStringParameters.limit ?? '10';
	const offset = event.queryStringParameters.offset ?? '0';

	const query = event.queryStringParameters.q;
	const keywords = event.queryStringParameters.keywords?.split(',');

	try {
		const result = await QnAService.getQuestions(
			parseInt(limit),
			parseInt(offset),
			{ query, keywords },
		);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// listWaitingQuestions
export const listWaitingQuestions: APIGatewayProxyHandler = async (event) => {
	event.queryStringParameters = event.queryStringParameters || {};

	const limit = event.queryStringParameters.limit ?? '10';
	const offset = event.queryStringParameters.offset ?? '0';

	try {
		const result = await QnAService.getWaitingQuestions(
			parseInt(limit),
			parseInt(offset),
		);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// createQuestion
export const createQuestion: APIGatewayProxyHandler = async (event) => {
	const data = JSON.parse(event.body) as {
		userID: string;
		title: string;
		content: string;
		images: string[];
		keywords: string[];
	};

	try {
		const result = await QnAService.createQuestion(
			data.userID,
			data.title,
			data.content,
			data.images,
			data.keywords,
		);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// getQuestionDetail
export const getQuestionDetail: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;

	try {
		const result = await QnAService.getQuestionDetail(questionID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// deleteQuestion
export const deleteQuestion: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;

	try {
		const result = await QnAService.deleteQuestion(questionID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// uploadQuestionImage
export const uploadQuestionImage: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;
	const uid = event.pathParameters.uid;
	const data = Buffer.from(event.body, 'base64');

	try {
		await QnAImageService.uploadQnAImage(questionID, uid, data);
		return createResponse(200, { uid: uid });
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// listAnswers
export const listAnswers: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;

	try {
		const result = await QnAService.getAnswers(questionID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// createAnswer
export const createAnswer: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;

	const data = JSON.parse(event.body) as {
		userID: string;
		content: string;
		refPartnerID?: string;
	};

	try {
		const result = await QnAService.createAnswer(
			data.userID,
			questionID,
			data.content,
			data.refPartnerID,
		);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};

// deleteAnswer
export const deleteAnswer: APIGatewayProxyHandler = async (event) => {
	const questionID = event.pathParameters.questionID;
	const answerID = event.pathParameters.answerID;

	try {
		const result = await QnAService.deleteAnswer(questionID, answerID);
		return createResponse(200, result);
	} catch (error) {
		console.log(error);
		return createResponse(500, error);
	}
};
