import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CardBodyComponent, CardComponent, CardHeaderComponent, ColComponent, RowComponent,} from '@coreui/angular';
import {FormsModule} from "@angular/forms";
import {SharedModule} from "../../../shared/shared.module";
import {
    VulnerabilitiesSourceChartComponent
} from "./vulnerabilities-source-chart/vulnerabilities-source-chart.component";
import {RepositoryOverviewCardComponent} from "./repository-overview-card/repository-overview-card.component";

@Component({
  selector: 'app-repository-info',
  standalone: true,
    imports: [
        RowComponent,
        ColComponent,
        CardComponent,
        CardBodyComponent,
        CardHeaderComponent,
        FormsModule,
        SharedModule,
        VulnerabilitiesSourceChartComponent,
        RepositoryOverviewCardComponent,

    ],
  templateUrl: './repository-info.component.html',
  styleUrls: ['./repository-info.component.scss']
})
export class RepositoryInfoComponent  {
  @Input() repoData: any;
  @Input() scanRunning: boolean = false;
  @Input() userRole: string = 'USER';
  @Input() topLanguages: { name: string; value: number; color: string }[] = [];
  @Input() chartPieData: any;
  @Input() options: any;

  @Output() runScanEvent = new EventEmitter<void>();
  @Output() runExploitabilityEvent = new EventEmitter<void>();
  @Output() openChangeTeamModalEvent = new EventEmitter<void>();
  @Output() updateFilterSource = new EventEmitter<any>();


  updateFilter($event: any) {
      this.updateFilterSource.emit($event);
  }

  runScan() {
      this.runScanEvent.emit();
  }

  runExploitabilityAnalysis() {
      this.runExploitabilityEvent.emit();
  }

  openChangeTeamModal() {
      this.openChangeTeamModalEvent.emit();
  }
}