import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from '../util/response';

import QnAService from '../service/qna';

// listQuestions
export const listQuestions: APIGatewayProxyHandler = async (event) => {
	event.queryStringParameters = event.queryStringParameters || {};

	const limit = event.queryStringParameters.limit ?? '10';
	const offset = event.queryStringParameters.offset ?? '0';

	const query = event.queryStringParameters.q;
	const category = event.queryStringParameters.category;
	const pettype = event.queryStringParameters.pettype;

	try {
		const result = await QnAService.getQuestions(
			parseInt(limit),
			parseInt(offset),
			{ query, category, pettype },
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
		usesrID: string;
		category: { code?: string; free?: string };
		pettype?: string;
		title: string;
		content: string;
	};

	try {
		const result = await QnAService.createQuestion(
			data.usesrID,
			data.category.code,
			data.category.free,
			data.pettype,
			data.title,
			data.content,
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
		refPartnerID: string;
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
