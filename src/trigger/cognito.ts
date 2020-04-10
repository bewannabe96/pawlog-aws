import { CognitoUserPoolTriggerHandler } from 'aws-lambda';

import UserService from '../service/user';

// onConfirmation
export const onConfirmation: CognitoUserPoolTriggerHandler = async (
	event,
	context,
	callback,
) => {
	context.callbackWaitsForEmptyEventLoop = false;

	const sub = event.request.userAttributes['sub'];
	const email = event.request.userAttributes['email'];
	const name = event.request.userAttributes['name'];
	let picture = event.request.userAttributes['picture'];

	const identities = JSON.parse(event.request.userAttributes['identities'])[0];
	if (identities.providerName === 'Facebook')
		picture = JSON.parse(picture).data.url;

	try {
		await UserService.createUser(sub, email, name, picture);
		callback(null, event);
	} catch (error) {
		console.log(error);
		callback(error);
	}
};
