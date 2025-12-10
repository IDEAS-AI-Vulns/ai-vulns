import {TeamUser} from "./TeamUser";

export interface Team {
    id: number;
    name: string;
    remoteIdentifier: string | null;
    users: TeamUser[];
}