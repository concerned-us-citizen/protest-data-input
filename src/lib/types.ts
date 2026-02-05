export interface Coordinates {
	lat: number;
	lon: number;
}
export type Nullable<T> = T | null;

export interface EventInfo {
	date: string;
	time: string;
	name: string;
	address: string;
	city: string;
	state: string;
	country: string;
	zip: string;
	link: string;
	accessible: string;
	recurring: string;
	coordinates: Nullable<Coordinates>;
	organizer: string;
}
