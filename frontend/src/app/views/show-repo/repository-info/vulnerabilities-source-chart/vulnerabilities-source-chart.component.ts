import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ChartjsComponent} from "@coreui/angular-chartjs";
import {NgForOf, NgIf} from "@angular/common";
import {Chart} from "chart.js";

@Component({
  selector: 'app-vulnerabilities-source-chart',
  templateUrl: './vulnerabilities-source-chart.component.html',
  standalone: true,
  imports: [
    ChartjsComponent,
    NgIf,
    NgForOf
  ],
  styleUrl: './vulnerabilities-source-chart.component.css'
})
export class VulnerabilitiesSourceChartComponent  implements OnInit, AfterViewInit   {
  @ViewChild('pieChartRef') pieChart!: ChartjsComponent;
  private chartInstance!: Chart<'pie', number[], unknown>;

  @Input() chartPieData: any;
  @Input() options: any = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        bodyFont: {
          size: 13
        },
        padding: 10
      }
    },
    cutout: '60%'
  };
  @Output() updateFilterSource = new EventEmitter<any>();

  ngOnInit(): void {
    // Enhance chart options with better defaults
    this.options = {
      ...this.options,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          bodyFont: {
            size: 13
          },
          padding: 10
        }
      },
      cutout: '60%'
    };
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const chartInstance = (this.pieChart as any)?.chart;

      if (chartInstance && chartInstance.canvas) {
        chartInstance.canvas.addEventListener('click', (evt: MouseEvent) => {
          const elements = chartInstance.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
          if (elements.length) {
            const first = elements[0];
            const label = chartInstance.data.labels[first.index];
            const value = chartInstance.data.datasets[first.datasetIndex].data[first.index];
            this.updateFilterSource.emit({ target: { value: label } });
          }
        });
      } else {
        console.warn('Chart instance or canvas not available yet');
      }
    }, 0);
  }
}
