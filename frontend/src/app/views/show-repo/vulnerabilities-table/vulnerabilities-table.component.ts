import {Component, EventEmitter, Input, Output} from '@angular/core';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective,
  FormLabelDirective,
  FormSelectDirective,
  SpinnerComponent,
  TooltipDirective
} from '@coreui/angular';
import {IconDirective} from '@coreui/icons-angular';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {DatePipe, NgClass, NgFor, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';

interface Vulnerability {
  id: number;
  name: string;
  source: string;
  location: string;
  severity: string;
  inserted: string;
  last_seen: string;
  status: string;
  urgency: string;
}

@Component({
  selector: 'app-vulnerabilities-table',
  standalone: true,
  imports: [
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    FormSelectDirective,
    NgIf,
    NgFor,
    NgClass,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective,
    ButtonDirective,
    SpinnerComponent,
    NgxDatatableModule,
    IconDirective,
    FormsModule,
    DatePipe,
    FormLabelDirective,
    TooltipDirective
  ],
  templateUrl: './vulnerabilities-table.component.html',
  styleUrls: ['./vulnerabilities-table.component.scss']
})
export class VulnerabilitiesTableComponent {
  @Input() repoData: any;
  @Input() vulns: Vulnerability[] = [];
  @Input() filteredVulns: Vulnerability[] = [];
  @Input() selectedBranch: string | null = null;
  @Input() showRemoved: boolean = false;
  @Input() showSuppressed: boolean = false;
  @Input() showUrgent: boolean = false;
  @Input() showNotable: boolean = false;
  @Input() hasUrgentFindings: boolean = false;
  @Input() hasNotableFindings: boolean = false;
  @Input() bulkActionMode: boolean = false;
  @Input() selectedFindings: number[] = [];
  @Input() vulnerabilitiesLoading: boolean = false;
  @Input() vulnerabilitiesLimit: number = 20;

  @Output() updateFilterNameEvent = new EventEmitter<any>();
  @Output() updateFilterLocationEvent = new EventEmitter<any>();
  @Output() updateFilterSourceEvent = new EventEmitter<any>();
  @Output() updateFilterStatusEvent = new EventEmitter<any>();
  @Output() updateFilterSeverityEvent = new EventEmitter<any>();
  @Output() toggleShowRemovedEvent = new EventEmitter<any>();
  @Output() toggleShowSuppressedEvent = new EventEmitter<any>();
  @Output() toggleShowUrgentEvent = new EventEmitter<any>();
  @Output() toggleShowNotableEvent = new EventEmitter<any>();
  @Output() toggleBulkActionEvent = new EventEmitter<void>();
  @Output() selectAllFindingsEvent = new EventEmitter<any>();
  @Output() onSelectFindingEvent = new EventEmitter<{id: number, event: any}>();
  @Output() suppressSelectedFindingsEvent = new EventEmitter<void>();
  @Output() onBranchSelectEvent = new EventEmitter<any>();
  @Output() viewVulnerabilityDetailsEvent = new EventEmitter<Vulnerability>();
  @Output() clearFiltersEvent = new EventEmitter<void>();

  filters: { [key: string]: string } = {
    name: '',
    location: '',
    source: '',
    status: '',
    severity: '',
  };

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
   * Update source filter
   */
  updateFilterSource(event: any): void {
    this.updateFilterSourceEvent.emit(event);
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

  /**
   * Toggle showing removed vulnerabilities
   */
  toggleShowRemoved(event: any): void {
    this.toggleShowRemovedEvent.emit(event);
  }

  /**
   * Toggle showing suppressed vulnerabilities
   */
  toggleShowSuppressed(event: any): void {
    this.toggleShowSuppressedEvent.emit(event);
  }

  /**
   * Toggle showing urgent vulnerabilities
   */
  toggleShowUrgent(event: any): void {
    this.toggleShowUrgentEvent.emit(event);
  }

  /**
   * Toggle showing notable vulnerabilities
   */
  toggleShowNotable(event: any): void {
    this.toggleShowNotableEvent.emit(event);
  }

  /**
   * Toggle bulk action mode
   */
  toggleBulkAction(): void {
    this.toggleBulkActionEvent.emit();
  }

  /**
   * Select all findings
   */
  selectAllFindings(event: any): void {
    this.selectAllFindingsEvent.emit(event);
  }

  /**
   * Select an individual finding
   */
  onSelectFinding(id: number, event: any): void {
    this.onSelectFindingEvent.emit({id, event});
  }

  /**
   * Suppress selected findings
   */
  suppressSelectedFindings(): void {
    this.suppressSelectedFindingsEvent.emit();
  }

  /**
   * Handle branch selection
   */
  onBranchSelect(event: any): void {
    this.onBranchSelectEvent.emit(event);
  }

  /**
   * Check if a vulnerability is selected
   */
  isSelected(id: number): boolean {
    return this.selectedFindings.includes(id);
  }

  /**
   * Show vulnerability details
   */
  click(row: Vulnerability): void {
    this.viewVulnerabilityDetailsEvent.emit(row);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.clearFiltersEvent.emit();
  }

  /**
   * Checks if the vulnerability source type should have a clickable link.
   * @param source The vulnerability source (e.g., 'SAST', 'SCA').
   */
  isLinkableSource(source: string): boolean {
    const linkableSources = ['SAST', 'IAC', 'SECRETS', 'DAST'];
    return linkableSources.includes(source);
  }

  /**
   * Get repository link for a vulnerability row
   */
  getRepositoryLinkForRow(row: any): string {
    if (!row?.location) {
      return '#';
    }
    // For DAST, the location is a full URL and can be used directly.
    if (row.source === 'DAST') {
      return row.location.startsWith('http') ? row.location : `//${row.location}`;
    }

    if (!this.repoData?.repourl) {
      return '#';
    }
    const location = row.location;
    const repoUrl = this.repoData.repourl;
    const branch = this.selectedBranch || this.repoData?.defaultBranch?.name;

    const match = location.match(/(.*):(\d+)/);
    if (!match) return repoUrl;

    const [, filePath, lineNumber] = match;

    if (repoUrl.includes('github.com')) {
      return `${repoUrl}/blob/${branch}/${filePath}#L${lineNumber}`;
    } else if (repoUrl.includes('gitlab.com')) {
      const baseUrl = repoUrl.replace(/\/?$/, '');
      return `${baseUrl}/-/blob/${branch}/${filePath}#L${lineNumber}`;
    }

    return repoUrl;
  }

  /**
   * Get formatted location for a vulnerability row
   */
  getFormattedLocationForRow(row: any): string {
    if (!row?.location) {
      return 'Location not available';
    }
    // For these types, display the raw location string.
    if (row.source === 'DAST' || row.source === 'SCA' || row.source === 'GITLAB_SCANNER') {
      return row.location;
    }

    // For SAST, IaC, Secrets, format it as path:line.
    const location = row.location;
    const match = location.match(/(.*):(\d+)/);
    if (!match) return location;

    const [, filePath, lineNumber] = match;
    return `${filePath}:${lineNumber}`;
  }
}