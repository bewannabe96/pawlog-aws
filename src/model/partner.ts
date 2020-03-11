interface Partner {
	id: string;
	name: string;
	images: string[];
	type: number;
	areacode: number;
	rate: number;
	reviews: number;
	location: {
		address: string;
		lat: number;
		lng: number;
	};
	operatingHours: {
		mon: string;
		tue: string;
		wed: string;
		thu: string;
		fri: string;
		sat: string;
		sun: string;
		ph: string;
	};
	contact: {
		email: string;
		phone: string;
	};
}

export default Partner;
