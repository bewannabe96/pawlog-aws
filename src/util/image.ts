interface Image {
	uid: string;
	url: string;
}

export const partnerImagesToReferences = (
	partnerID: string,
	uids: string,
): Image[] => {
	if (uids === '') return [];

	return uids.split(':').map((uid) => ({
		uid: uid,
		url: `https://${process.env.PARTNER_IMAGE_BUCKET_DOMAIN}/${partnerID}/${uid}`,
	}));
};

export const reviewImagesToReferences = (
	partnerID: string,
	reviewID: string,
	uids: string,
): Image[] => {
	if (uids === '') return [];

	return uids.split(':').map((uid) => ({
		uid: uid,
		url: `https://${process.env.PARTNER_IMAGE_BUCKET_DOMAIN}/${partnerID}/${reviewID}/${uid}`,
	}));
};

export const questionImagesToReferences = (
	questionID: string,
	uids: string,
): Image[] => {
	if (uids === '') return [];

	return uids.split(':').map((uid) => ({
		uid: uid,
		url: `https://${process.env.QNA_IMAGE_BUCKET_DOMAIN}/${questionID}/${uid}`,
	}));
};
