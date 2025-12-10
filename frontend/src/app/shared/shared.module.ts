import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InfoTileComponent} from './info-tile/info-tile.component';
import {GaugeChartComponent} from './gauge-chart/gauge-chart.component';
import {ChartjsComponent} from "@coreui/angular-chartjs";
import {RiskLevelComponent} from './risk-level/risk-level.component';
import {
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    ProgressComponent,
    RowComponent,
    TextColorDirective
} from "@coreui/angular";
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
        RiskLevelComponent,
        FoldableContainerComponent
    ],
    imports: [
        CommonModule,
        ChartjsComponent,
        ProgressComponent,
        TextColorDirective,
        IconDirective,
        ColComponent,
        CardComponent,
        CardHeaderComponent,
        RowComponent,
        ButtonDirective,
        CardBodyComponent
    ]
})
export class SharedModule { }
