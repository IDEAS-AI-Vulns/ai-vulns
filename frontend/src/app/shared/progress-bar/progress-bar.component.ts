import {Component, Input, OnInit} from '@angular/core';
import {ThemeService} from "../../service/theme/theme.service";

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.css']
})
export class ProgressBarComponent implements OnInit {

  @Input() value: number = 0;
  @Input() color: string = '#ffffff';
  @Input() labels: string[] = [];

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {};
}
