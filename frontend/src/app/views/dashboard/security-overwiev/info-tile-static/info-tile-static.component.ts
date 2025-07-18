import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-info-tile-static',
  templateUrl: './info-tile-static.component.html',
  styleUrl: './info-tile-static.component.scss'
})
export class InfoTileStaticComponent implements OnInit {

  @Input() type: string = "";
  @Input() title: string = "";
  @Input() icon: string = "";
  @Input() value: string = "";
  @Input() valueSuffix?: string = "";
  @Input() trend?: string = undefined;
  @Input() description?: string = undefined;
  @Input() link?: string = undefined;

  protected trendIcon: string = "";
  protected trendText: string = "";
  protected trendClass: string = "";

  ngOnInit(): void {
    if (this.trend === 'up') {
      this.trendIcon = 'cil-arrow-top';
      this.trendText = 'Increasing';
      this.trendClass = 'text-danger'
    }
    else if (this.trend === 'down') {
      this.trendIcon = 'cil-arrow-bottom';
      this.trendText = 'Decreasing';
      this.trendClass = 'text-success'
    } else {
      this.trendIcon = 'cil-minus';
      this.trendText = 'Stable';
      this.trendClass = 'text-muted'
    }
  }
}
