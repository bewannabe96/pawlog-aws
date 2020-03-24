export interface Area {
	code: string;
	name: string;
}

export interface PartnerType {
	code: string;
	name: string;
}

export interface PartnerDetail {
	operatingHours: OperatingHours;
	contact: Contact;
}

export interface ReviewSummary {
	averageRate: number;
	count: number;
}

export interface Location {
	address: string;
	lat: number;
	lng: number;
}

export interface OperatingHours {
	mon?: string;
	tue?: string;
	wed?: string;
	thu?: string;
	fri?: string;
	sat?: string;
	sun?: string;
	ph?: string;
}

export interface Contact {
	email?: string;
	phone?: string;
}

export interface Review {
	rate: number;
	content: string;
}

export interface User {
	id: string;
	name: string;
	email: string;
	picture: string;
}
