import {Location} from "./Location";

export interface AppDataType {
    id: number;
    categoryName: string;
    name: string;
    categoryGroups: string[];
    location: Location;
}