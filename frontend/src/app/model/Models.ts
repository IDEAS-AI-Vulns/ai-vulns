import {Vulnerability} from "./Vulnerability";
import {AppDataType} from "./AppDataType";
import {Team} from "./Team";

export interface SingleFindingDTO {
    vulnsResponseDto?: Vulnerability;
    description?: string;
    recommendation?: string;
    explanation?: string;
    refs?: string;
    comments?: Comment[];
}

export interface Comment {
    id: number;
    message: string;
    author: string;
    inserted: string;
}

// models/repo.model.ts
export interface Repo {
    id: number;
    name: string;
    repourl: string;
    insertedDate: string;
    defaultBranch: Branch;
    branches: Branch[];
    team?: Team;
    languages: { [name: string]: number };
    appDataTypes: AppDataType[];
    components: any[];
    scanInfos: ScanInfo[];
    sastScan: string;
    scaScan: string;
    secretsScan: string;
    iacScan: string;
    dastScan: string;
    gitlabScan: string;
}

export interface Branch {
    id: string;
    name: string;
}

// models/finding-stats.model.ts
export interface FindingSourceStatDTO {
    sast: number;
    sca: number;
    secrets: number;
    iac: number;
    dast: number;
}

export interface FindingDTO {
    // Properties will depend on your API
}

// models/scan-info.model.ts
export interface ScanInfo {
    id: number;
    codeRepoBranch: Branch;
    commitId: string;
    insertedDate: string;
    sastCritical: number;
    sastHigh: number;
    sastMedium: number;
    sastRest: number;
    scaCritical: number;
    scaHigh: number;
    scaMedium: number;
    scaRest: number;
    iacCritical: number;
    iacHigh: number;
    iacMedium: number;
    iacRest: number;
    secretsCritical: number;
    secretsHigh: number;
    secretsMedium: number;
    secretsRest: number;
    dastCritical: number;
    dastHigh: number;
    dastMedium: number;
    dastRest: number;
    gitlabCritical: number;
    gitlabHigh: number;
    gitlabMedium: number;
    gitlabRest: number;
}

// models/chart.model.ts
export interface LanguageInfo {
    name: string;
    value: number;
    color: string;
}