import {Component, Input, OnInit} from '@angular/core';
import {securityOverviewChartOptions} from "./chart-config";

@Component({
  selector: 'app-security-overview',
  templateUrl: './security-overview.component.html',
  styleUrl: './security-overview.component.scss'
})
export class SecurityOverviewComponent implements OnInit {

  //TODO: explicit dataType
  //TODO: re-think data that is passed to the component
  @Input() securityStats: any;
  @Input() widgetStats?: any;
  @Input() securityTrendData: any;
  @Input() vulnerabilityTrendData: any;
  @Input() trendDataLoaded: any;

  protected chartOptions = securityOverviewChartOptions;

  ngOnInit(): void {
  }

  // TODO: move this method to service
  // Calculate security trend (up/down/stable)
  getSecurityTrend(type: string): string {
    if (this.securityTrendData.length < 2) return 'stable';

    const latestDataPoint = this.securityTrendData[this.securityTrendData.length - 1];
    const previousDataPoint = this.securityTrendData[this.securityTrendData.length - 2];

    let latest = 0;
    let previous = 0;

    if (type === 'critical') {
      latest = (latestDataPoint.sastCritical || 0) + (latestDataPoint.scaCritical || 0) +
          (latestDataPoint.iacCritical || 0) + (latestDataPoint.secretsCritical || 0) + (latestDataPoint.dastCritical || 0) + (latestDataPoint.gitlabCritical || 0);

      previous = (previousDataPoint.sastCritical || 0) + (previousDataPoint.scaCritical || 0) +
          (previousDataPoint.iacCritical || 0) + (previousDataPoint.secretsCritical || 0) + (previousDataPoint.dastCritical || 0) + (previousDataPoint.gitlabCritical || 0);
    } else if (type === 'high') {
      latest = (latestDataPoint.sastHigh || 0) + (latestDataPoint.scaHigh || 0) +
          (latestDataPoint.iacHigh || 0) + (latestDataPoint.secretsHigh || 0) + (latestDataPoint.dastHigh || 0) + (latestDataPoint.gitlabHigh || 0);

      previous = (previousDataPoint.sastHigh || 0) + (previousDataPoint.scaHigh || 0) +
          (previousDataPoint.iacHigh || 0) + (previousDataPoint.secretsHigh || 0) + (previousDataPoint.dastHigh || 0) + (previousDataPoint.gitlabHigh || 0);
    } else if (type === 'total') {
      latest = latestDataPoint.openFindings || 0;
      previous = previousDataPoint.openFindings || 0;
    }

    if (latest === previous) return 'stable';
    return latest > previous ? 'up' : 'down';
  }

  // TODO: move this method to service
  // Calculate a simple security score based on findings
  calculateSecurityScore(): string {
    if (!this.securityStats) {
      return 'N/A';
    }

    // Simple scoring algorithm: 100 - (critical*5 + high*3 + medium)/(total repos * 10)
    // This is just an example - real scoring would be more sophisticated
    const criticalPenalty = (this.securityStats.criticalTotal || 0) * 5;
    const highPenalty = (this.securityStats.highTotal || 0) * 3;
    const mediumPenalty = (this.securityStats.mediumTotal || 0);

    const totalRepos = this.securityStats.totalRepos || 1; // Avoid division by zero
    const totalPenalty = criticalPenalty + highPenalty + mediumPenalty;

    let score = 100 - (totalPenalty / (totalRepos * 10));
    score = Math.max(0, Math.min(100, score)); // Ensure score is between 0-100

    // Format as letter grade based on score
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}