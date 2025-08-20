import {
    GitProvider
} from "../../views/dashboard/administrative-actions/bulk-repository-import-modal/bulk-repository-import-modal.component";

export interface GitProject {
    id: string,
    name: string,
    path_with_namespace: string,
    web_url: string,
    imported: boolean,
    type: GitProvider
}