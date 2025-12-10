import {Component, Input, OnInit} from '@angular/core';
import {ChartData} from "chart.js/dist/types";
import {ThemeService} from "../../service/theme/theme.service";

@Component({
  selector: 'app-gauge-chart',
  templateUrl: './gauge-chart.component.html',
  styleUrl: './gauge-chart.component.css'
})
export class GaugeChartComponent implements OnInit {

  @Input() level: number = 0;
  @Input() color: string = '#ffffff';

  data: ChartData = {
    datasets: [
      {
        backgroundColor: ['#DD1B16', '#E46651'],
        data: [80, 20]
      }
    ]
  };

  options = {
    responsive: true,
    maintainAspectRatio: false,
    rotation: -90,
    circumference: 180,
    cutout: '70%',
    plugins: {
      legend: {
        display: false
      }
    }
  }

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.data.datasets[0].data = [this.level, 100-this.level];

    this.data.datasets[0].backgroundColor = [ this.color, this.themeService.getCssVariable('--gray-300')]
  }

}
