// [sun, mon, tue, wed, thu, fri, sat]
export const isCurrentlyOpened = (operatingHours: string[]): boolean | null => {
	const now = new Date();
	const today = operatingHours[now.getDay()];

	if (!today) return null;
	else if (today === 'closed') return false;

	const [open, close] = today.split('-');

	const openParsed = Date.parse(`01/01/1996 ${open}`);
	const closeParsed = Date.parse(`01/01/1996 ${close}`);
	const nowParsed = Date.parse(
		`01/01/1996 ${now.getHours()}:${now.getMinutes()}`,
	);

	return openParsed < nowParsed && nowParsed < closeParsed;
};
