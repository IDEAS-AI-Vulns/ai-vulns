import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    BadgeComponent,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, FormLabelDirective,
    FormSelectDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    RowComponent,
    SpinnerComponent,
    TooltipDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Vulnerability {
  id: number;
  name: string;
  source: string;
  location: string;
  severity: string;
  inserted: string;
  last_seen: string;
  status: string;
}

@Component({
  selector: 'app-cloud-vulnerabilities-table',
  standalone: true,
    imports: [
        CardComponent,
        CardHeaderComponent,
        CardBodyComponent,
        RowComponent,
        ColComponent,
        FormSelectDirective,
        InputGroupComponent,
        InputGroupTextDirective,
        ButtonDirective,
        SpinnerComponent,
        NgxDatatableModule,
        IconDirective,
        BadgeComponent,
        DatePipe,
        NgIf,
        NgFor,
        NgClass,
        FormsModule,
        TooltipDirective,
        FormCheckComponent,
        FormCheckInputDirective,
        FormCheckLabelDirective,
        FormLabelDirective
    ],
  templateUrl: './cloud-vulnerabilities-table.component.html',
  styleUrls: ['./cloud-vulnerabilities-table.component.scss']
})
export class CloudVulnerabilitiesTableComponent {
  @Input() filteredVulns: Vulnerability[] = [];
  @Input() vulnerabilitiesLoading: boolean = false;
  @Input() vulnerabilitiesLimit: number = 15;

  @Output() updateFilterNameEvent = new EventEmitter<any>();
  @Output() updateFilterLocationEvent = new EventEmitter<any>();
  @Output() updateFilterStatusEvent = new EventEmitter<any>();
  @Output() updateFilterSeverityEvent = new EventEmitter<any>();
  @Output() toggleShowRemovedEvent = new EventEmitter<any>();
  @Output() viewVulnerabilityDetailsEvent = new EventEmitter<Vulnerability>();
  @Output() vulnerabilitiesLimitChange = new EventEmitter<number>();

  /**
   * Update name filter
   */
  updateFilterName(event: any): void {
    this.updateFilterNameEvent.emit(event);
  }

  /**
   * Update location filter
   */
  updateFilterLocation(event: any): void {
    this.updateFilterLocationEvent.emit(event);
  }

  /**
   * Update status filter
   */
  updateFilterStatus(event: any): void {
    this.updateFilterStatusEvent.emit(event);
  }

  /**
   * Update severity filter
   */
  updateFilterSeverity(event: any): void {
    this.updateFilterSeverityEvent.emit(event);
  }

  toggleShowRemoved(event: any): void {
    this.toggleShowRemovedEvent.emit(event);
  }

  /**
   * Handle limit change for pagination
   */
  onLimitChange(newLimit: number): void {
    this.vulnerabilitiesLimit = newLimit;
    this.vulnerabilitiesLimitChange.emit(newLimit);
  }

  /**
   * View vulnerability details
   */
  click(row: Vulnerability): void {
    this.viewVulnerabilityDetailsEvent.emit(row);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    // Implement this method if needed for the empty state action
  }
}