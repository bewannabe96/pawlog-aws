import Axios from 'axios';

const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

interface TokenHeader {
	kid: string;
	alg: string;
}

interface PublicKey {
	alg: string;
	e: string;
	kid: string;
	kty: string;
	n: string;
	use: string;
}

interface PublicKeys {
	keys: PublicKey[];
}

interface PublicKeyMeta {
	instance: PublicKey;
	pem: string;
}

interface Claim {
	token_use: string;
	auth_time: number;
	iss: string;
	exp: number;
	username: string;
	client_id: string;
}

const verifyJWT = async (token: string) => {
	const tokenSections = (token || '').split('.');
	if (tokenSections.length < 2) throw new Error('InvalidToken');

	const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
	const header = JSON.parse(headerJSON) as TokenHeader;

	const publicKeys = await Axios.get<PublicKeys>(
		`${process.env.COGNITO_PROVIDER_URL}/.well-known/jwks.json`,
	);

	const publicKey = publicKeys.data.keys.find(
		(value) => value.kid == header.kid,
	);
	if (!publicKey) throw new Error('UnknownKid');
	const key: PublicKeyMeta = { instance: publicKey, pem: jwkToPem(publicKey) };

	const claim = await new Promise<Claim>((resolve, reject) => {
		jwt.verify(token, key.pem, (error: string, decoded: Claim) => {
			if (error) reject(error);
			else if (decoded) resolve(decoded);
		});
	});

	const currentSeconds = Math.floor(new Date().valueOf() / 1000);
	if (currentSeconds > claim.exp || currentSeconds < claim.auth_time)
		throw new Error('ClaimExpired');
	else if (claim.iss !== process.env.COGNITO_PROVIDER_URL)
		throw new Error('ClaimIssuerInvalid');
};

export const handler = async (event, _, callback) => {
	try {
		await verifyJWT(event.authorizationToken);

		callback(null, {
			principalId: 'apigateway.amazonaws.com',
			policyDocument: {
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'execute-api:Invoke',
						Effect: 'Allow',
						Resource: '*',
					},
				],
			},
		});
	} catch {
		callback('Unauthorized');
	}
};
