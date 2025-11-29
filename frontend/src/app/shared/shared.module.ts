import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InfoTileComponent} from './info-tile/info-tile.component';
import {GaugeChartComponent} from './gauge-chart/gauge-chart.component';
import {ChartjsComponent} from "@coreui/angular-chartjs";
import {RiskLevelComponent} from './risk-level/risk-level.component';
import {ProgressComponent, TextColorDirective} from "@coreui/angular";
import {ProgressBarComponent} from './progress-bar/progress-bar.component';
import {IconDirective} from "@coreui/icons-angular";
import {FoldableContainerComponent} from './foldable-container/foldable-container.component';

@NgModule({
  declarations: [
    InfoTileComponent,
    GaugeChartComponent,
    RiskLevelComponent,
    ProgressBarComponent,
    FoldableContainerComponent
  ],
    exports: [
        InfoTileComponent,
        RiskLevelComponent
    ],
    imports: [
        CommonModule,
        ChartjsComponent,
        ProgressComponent,
        TextColorDirective,
        IconDirective
    ]
})
export class SharedModule { }
