import {DataUpdateLogError} from "./data-update-log-error";

export interface DataUpdateLog {
    id: number;
    createdDate: Date;
    status: string;
    processed: number;
    error: number;
    fileExists: boolean;
    errors?: DataUpdateLogError[];
}