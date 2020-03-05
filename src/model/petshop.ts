import Location from './location';
import OperatingHours from './operating-hours';
import Contact from './contact';

interface Petshop {
	name: string;
	images: string[];
	location: Location;
	operatingHours: OperatingHours;
	contact: Contact;
}

export default Petshop;
