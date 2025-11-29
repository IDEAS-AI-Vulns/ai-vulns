import {Component, Input, OnInit} from '@angular/core';
import {ThemeService} from "../../service/theme/theme.service";

@Component({
  selector: 'app-risk-level',
  templateUrl: './risk-level.component.html',
  styleUrls: ['./risk-level.component.css']
})
export class RiskLevelComponent implements OnInit {

  @Input() level: number = 78;

  levelColor = '';
  description: string = 'Critical security issues';
  labels: string[] = ['Low', 'Medium', 'High', 'Critical'];

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    if(this.level < 34) {
      this.levelColor = this.themeService.getCssVariable('--green-600');
    } else if ( this.level < 67) {
      this.levelColor = this.themeService.getCssVariable('--yellow-600');
    } else {
      this.levelColor = this.themeService.getCssVariable('--red-600');
    }
  }
}
