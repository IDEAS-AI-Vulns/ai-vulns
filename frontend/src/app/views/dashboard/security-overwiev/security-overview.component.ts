import {Component, effect, inject} from '@angular/core';
import {securityOverviewChartOptions} from "./chart-config";
import {StatsService} from "../../../service/stats/stats.service";

@Component({
  selector: 'app-security-overview',
  templateUrl: './security-overview.component.html',
  styleUrl: './security-overview.component.scss'
})
export class SecurityOverviewComponent {

  vulnerabilityTrendData: any;
  trendDataLoaded: any;

  protected chartOptions = securityOverviewChartOptions;

  protected statsService = inject(StatsService);
  protected securityStatsSignal = this.statsService.vulnerabilitySummary;
  private securityTrendDataSignal = this.statsService.vulnerabilityTrend;

  constructor() {
    effect(() => {
      this.prepareVulnerabilityTrendChart();
      this.calculateSecurityScore();
    });
  }

  // TODO: move this method to service
  // Calculate security trend (up/down/stable)
  getSecurityTrend(type: string): string {
    const securityTrendData = this.securityTrendDataSignal();
    if (securityTrendData.length < 2) return 'stable';

    const latestDataPoint = securityTrendData[securityTrendData.length - 1];
    const previousDataPoint = securityTrendData[securityTrendData.length - 2];

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
    const securityStats = this.securityStatsSignal();
    if (!securityStats) {
      return 'N/A';
    }

    // Simple scoring algorithm: 100 - (critical*5 + high*3 + medium)/(total repos * 10)
    // This is just an example - real scoring would be more sophisticated
    const criticalPenalty = (securityStats.criticalTotal || 0) * 5;
    const highPenalty = (securityStats.highTotal || 0) * 3;
    const mediumPenalty = (securityStats.mediumTotal || 0);

    const totalRepos = securityStats.totalRepos || 1; // Avoid division by zero
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

  // Prepare vulnerability trend chart data
  prepareVulnerabilityTrendChart(): void {
    const securityTrendData = this.securityTrendDataSignal();
    if (!securityTrendData || securityTrendData.length === 0) {
      console.log('No security trends found.');
      console.log(this.statsService.vulnerabilityTrend());
      return;
    }

    // Sort data by date ascending
    securityTrendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Extract dates for labels
    const labels = securityTrendData.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    // Create datasets for critical and high vulnerabilities (simplified for dashboard)
    const criticalData = securityTrendData.map(item =>
        (item.sastCritical || 0) + (item.scaCritical || 0) +
        (item.iacCritical || 0) + (item.secretsCritical || 0) + (item.dastCritical || 0)
        + (item.gitlabCritical || 0)
    );

    const highData = securityTrendData.map(item =>
        (item.sastHigh || 0) + (item.scaHigh || 0) +
        (item.iacHigh || 0) + (item.secretsHigh || 0) + (item.dastHigh || 0)
        + (item.gitlabHigh || 0)
    );

    // Create background gradient for chart
    const createGradient = (ctx: CanvasRenderingContext2D, color: string, opacity: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 250);
      gradient.addColorStop(0, `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${color}00`);
      return gradient;
    };

    this.vulnerabilityTrendData = {
      labels: labels,
      datasets: [
        {
          label: 'Critical',
          data: criticalData,
          borderColor: '#dc3545',
          backgroundColor: function(context: any) {
            const chart = context.chart;
            const {ctx} = chart;
            return createGradient(ctx, '#dc3545', 0.3);
          },
          borderWidth: 2,
          fill: true,
          pointBackgroundColor: '#dc3545',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#dc3545',
          pointHoverBorderWidth: 2,
          pointHoverRadius: 6,
          pointRadius: 4,
          tension: 0.3
        },
        {
          label: 'High',
          data: highData,
          borderColor: '#fd7e14',
          backgroundColor: function(context: any) {
            const chart = context.chart;
            const {ctx} = chart;
            return createGradient(ctx, '#fd7e14', 0.3);
          },
          borderWidth: 2,
          fill: true,
          pointBackgroundColor: '#fd7e14',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#fd7e14',
          pointHoverBorderWidth: 2,
          pointHoverRadius: 6,
          pointRadius: 4,
          tension: 0.3
        }
      ]
    };

    console.log('Happily here');
    console.log(this.vulnerabilityTrendData);
  }
}