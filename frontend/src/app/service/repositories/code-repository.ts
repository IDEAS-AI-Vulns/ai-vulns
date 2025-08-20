export interface CodeRepository {
    id: number;
    target: string;
    repo_url: string;
    team: string;
    sast: string;
    iac: string;
    secrets: string;
    sca: string;
    dast: string;
    gitlab: string;
}
