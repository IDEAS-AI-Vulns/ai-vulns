export interface WidgetStatistics {
    activeFindings: FindingsDate[],
    removedFindingsList: FindingsDate[],
    reviewedFindingsList: FindingsDate[],
    averageFixTimeList: FindingsDate[],
}

export interface FindingsDate {
    date: string,
    findings: number
}
