import {computed, inject, Injectable, signal} from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {catchError} from "rxjs/operators";
import {DashboardMetrics} from "./dashboard-metrics";
import {WidgetStatistics} from "./widget-statistics";
import {VulnerabilitySummary, VulnerabilityTrendDataPoint} from "../../model/stats.models";

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.backendUrl+"/api/v1/stats";

  private readonly _dashboardMetrics = signal<DashboardMetrics>({
    totalScans: 0,
    teams: 0,
    monthlyScans: 0
  });
  readonly dashboardMetrics = computed(() => this._dashboardMetrics());

  private readonly _widgetStats = signal<WidgetStatistics>({
    activeFindings: [],
    removedFindingsList: [],
    reviewedFindingsList: [],
    averageFixTimeList: [],
  });
  readonly widgetStats = computed(() => this._widgetStats())

  private readonly _vulnerabilitySummary = signal<VulnerabilitySummary>({
    totalRepos: 0,
    criticalTotal: 0,
    highTotal: 0,
    mediumTotal: 0,
    lowTotal: 0,
    sastTotal: 0,
    scaTotal: 0,
    iacTotal: 0,
    secretsTotal: 0,
    gitlabTotal: 0,
    openTotal: 0,
    removedTotal: 0,
    reviewedTotal: 0,
    averageFixTime: 0,
    dastTotal: 0,
  });
  readonly vulnerabilitySummary = computed(() => this._vulnerabilitySummary())

  private readonly _vulnerabilityTrend = signal<VulnerabilityTrendDataPoint[]>([]);
  readonly vulnerabilityTrend = computed(() => this._vulnerabilityTrend())

  fetchVulnerabilityTrend(teamId: number | null = null, days: number = 30) {
    let params = new HttpParams();

    if (teamId !== null) {
      params = params.append('teamId', teamId.toString());
    }

    params = params.append('days', days.toString());

    this.http.get<VulnerabilityTrendDataPoint[]>(`${this.apiBaseUrl}/trend`, { params }).pipe(
        catchError(err => {
          console.error('Failed to fetch settings', err);
          return  of([]);
        })
    ).subscribe(data => {
      console.log('Trend data loaded', data);
      this._vulnerabilityTrend.set(data);
    });
  }

  fetchVulnerabilitySummary(teamId: number | null = null) {
    let params = new HttpParams();

    if (teamId !== null) {
      params = params.append('teamId', teamId.toString());
    }

    this.http.get<any>(`${this.apiBaseUrl}/summary`, { params }).pipe(
        catchError(err => {
          console.error('Failed to fetch settings', err);
          return  of([]);
        })
    ).subscribe(data => {
      this._vulnerabilitySummary.set(data);
    });
  }

  /**
   * Get repositories with the most vulnerabilities
   * @param teamId Optional team ID to filter by team
   * @param limit Maximum number of results to return
   */
  getTopVulnerableRepos(teamId: number | null, limit: number): Observable<any[]> {
    let params = new HttpParams();

    if (teamId !== null) {
      params = params.append('teamId', teamId.toString());
    }

    params = params.append('limit', limit.toString());

    return this.http.get<any[]>(`${this.apiBaseUrl}/top-repos`, { params });
  }

  /**
   * Get vulnerability statistics grouped by team
   */
  getTeamsSummary(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/teams-summary`);
  }

  fetchDashboardMetrics() {
    this.http.get<any>(`${this.apiBaseUrl}/dashboard-metrics`, { withCredentials: true }).pipe(
        catchError(err => {
          console.error('Failed to fetch settings', err);
          return  of([]);
        })
    ).subscribe(data => {
      this._dashboardMetrics.set(data);
    });
  }

  fetchAggregatedStats() {
    this.http.get<any>(environment.backendUrl + '/api/v1/widget_stats',{ withCredentials: true }).pipe(
        catchError(err => {
          console.error('Failed to fetch settings', err);
          return  of([]);
        })
    ).subscribe(data => {
      this._widgetStats.set(data);
    });
  }

}
