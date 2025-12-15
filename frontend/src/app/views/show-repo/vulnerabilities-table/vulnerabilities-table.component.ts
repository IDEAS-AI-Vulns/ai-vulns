import {Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import * as XLSX from 'xlsx';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective,
  FormSelectDirective,
  SpinnerComponent,
  TooltipDirective
} from '@coreui/angular';
import {IconDirective} from '@coreui/icons-angular';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RelativeTimePipe} from "../../../utils/pipes/relative-time.pipe";
import {PercentRoundedPipe} from "../../../utils/pipes/percentage.pipe";
import {ThemeService} from "../../../service/theme/theme.service";
import {environment} from "../../../../environments/environment";
import {SharedModule} from "../../../shared/shared.module";
import {ExploitabilityLevel} from "../../../model/enums/exploitability-level";
import {ChangeContext, NgxSliderModule, Options} from "@angular-slider/ngx-slider";

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
    TooltipDirective,
    RelativeTimePipe,
    PercentRoundedPipe,
    SharedModule,
    NgxSliderModule
  ],
  templateUrl: './vulnerabilities-table.component.html',
  styleUrls: ['./vulnerabilities-table.component.scss']
})
export class VulnerabilitiesTableComponent implements OnInit, OnChanges {
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
  @Input() currentFilters: { [key: string]: string } | null = null;

  @Output() updateFilterNameEvent = new EventEmitter<any>();
  @Output() updateFilterLocationEvent = new EventEmitter<any>();
  @Output() updateFilterSourceEvent = new EventEmitter<any>();
  @Output() updateFilterStatusEvent = new EventEmitter<any>();
  @Output() updateFilterSeverityEvent = new EventEmitter<any>();
  @Output() updateFilterExploitabilityEvent = new EventEmitter<any>();
  @Output() toggleShowRemovedEvent = new EventEmitter<any>();
  @Output() toggleShowSuppressedEvent = new EventEmitter<any>();
  @Output() toggleBulkActionEvent = new EventEmitter<void>();
  @Output() toggleAdvancedOptionsEvent = new EventEmitter<void>();
  @Output() selectAllFindingsEvent = new EventEmitter<any>();
  @Output() onSelectFindingEvent = new EventEmitter<{id: number, event: any}>();
  @Output() suppressSelectedFindingsEvent = new EventEmitter<void>();
  @Output() onBranchSelectEvent = new EventEmitter<any>();
  @Output() viewVulnerabilityDetailsEvent = new EventEmitter<Vulnerability>();
  @Output() clearFiltersEvent = new EventEmitter<void>();
  statusFilter: string = '';
  advancedOptionsVisible: boolean = false;

  private themeService: ThemeService = inject(ThemeService);

  @Input() selectedSeverity: string[] = [];
  severityOptions = ['Critical', 'High', 'Medium', 'Low', 'Info'];

  @Input() selectedSource: string[] = [];
  sourceOptions = ['SAST', 'IAC', 'SECRETS', 'SCA', 'DAST'];

  @Input() selectedExploitability: string[] = [];
  exploitabilityOptions = Object.values(ExploitabilityLevel) as string[];

  exploitabilityRangeStart: number = 0;
  exploitabilityRangeEnd: number = 100;
  exploitabilityRangeFilterOptions: Options = {
    floor: 0,
    ceil: 100,
    step: 1
  };

  // Ensure we have a local object to bind to when parent hasn't provided one yet
  private ensureCurrentFilters(): { [key: string]: string } {
    if (!this.currentFilters) {
      this.currentFilters = { name: '', location: '', source: '', status: '', severity: '' };
    }
    return this.currentFilters;
  }

  // Safe proxy for template bindings (always non-null)
  get cf(): { [key: string]: string } {
    return this.ensureCurrentFilters();
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    // Do not auto-reset filters here; parent owns source-of-truth (persistence/restore)
  }

  /**
   * Update name filter
   */
  updateFilterName(valueOrEvent: any): void {
    const v = (typeof valueOrEvent === 'string')
      ? valueOrEvent
      : (valueOrEvent?.target?.value ?? '').toString();
    this.ensureCurrentFilters()['name'] = v;
    this.updateFilterNameEvent.emit({ target: { value: v } });
  }

  /**
   * Update location filter
   */
  updateFilterLocation(valueOrEvent: any): void {
    const v = (typeof valueOrEvent === 'string')
      ? valueOrEvent
      : (valueOrEvent?.target?.value ?? '').toString();
    this.ensureCurrentFilters()['location'] = v;
    this.updateFilterLocationEvent.emit({ target: { value: v } });
  }

  /**
   * Update source filter
   */
  updateFilterSource(valueOrEvent: any): void {
    const v = (typeof valueOrEvent === 'string')
      ? valueOrEvent
      : (valueOrEvent?.target?.value ?? '').toString();
    this.ensureCurrentFilters()['source'] = v;
    this.updateFilterSourceEvent.emit({ target: { value: v } });
  }

  /**
   * Update status filter
   */
  updateFilterStatus(valueOrEvent: any): void {
    const v = (typeof valueOrEvent === 'string')
      ? valueOrEvent
      : (valueOrEvent?.target?.value ?? '').toString();
    this.ensureCurrentFilters()['status'] = v;
    this.updateFilterStatusEvent.emit({ target: { value: v } });
  }

  /**
   * Update severity filter
   */
  updateFilterSeverity(valueOrEvent: any): void {
    const v = (typeof valueOrEvent === 'string')
      ? valueOrEvent
      : (valueOrEvent?.target?.value ?? '').toString();
    this.ensureCurrentFilters()['severity'] = v;
    this.updateFilterSeverityEvent.emit({ target: { value: v } });
  }

  exploitabilityRangeChange($event: ChangeContext) {
    this.updateFilterExploitabilityEvent.emit({ target: { value: $event } });
    this.selectedExploitability = [];

    if (this.exploitabilityRangeStart == 0 && this.exploitabilityRangeEnd == environment.likelyExploitThreshold * 100) {
      this.selectedExploitability = [ExploitabilityLevel.LOW];
    } else if (this.exploitabilityRangeStart == environment.likelyExploitThreshold * 100 + 1 && this.exploitabilityRangeEnd == environment.reachableExploitThreshold * 100) {
      this.selectedExploitability = [ExploitabilityLevel.LIKELY_REACHABLE];
    } else if (this.exploitabilityRangeStart == environment.reachableExploitThreshold * 100 + 1 && this.exploitabilityRangeEnd == 100) {
      this.selectedExploitability = [ExploitabilityLevel.REACHABLE];
    }


  }

  updateFilterExploitability(valueOrEvent: any): void {
    const v = (typeof valueOrEvent === 'string')
        ? valueOrEvent
        : (valueOrEvent?.target?.value ?? '').toString();

    switch (v) {
      case ExploitabilityLevel.REACHABLE: {
        this.exploitabilityRangeStart = environment.reachableExploitThreshold * 100 + 1;
        this.exploitabilityRangeEnd = 100;
        break;
      }
      case ExploitabilityLevel.LIKELY_REACHABLE: {
        this.exploitabilityRangeStart = environment.likelyExploitThreshold * 100 + 1;
        this.exploitabilityRangeEnd = environment.reachableExploitThreshold * 100;
        break;
      }
      case ExploitabilityLevel.LOW: {
        this.exploitabilityRangeStart = 0;
        this.exploitabilityRangeEnd = environment.likelyExploitThreshold * 100;
        break;
      }
      default: {
        this.exploitabilityRangeStart = 0;
        this.exploitabilityRangeEnd = 100;
        break;
      }
    }

    this.exploitabilityRangeChange({
      value: this.exploitabilityRangeStart,
      highValue: this.exploitabilityRangeEnd,
      pointerType: 1
    })
  }

  /**
   * Toggle showing removed vulnerabilities
   */
  toggleShowRemoved(stateOrEvent: any): void {
    const checked = (typeof stateOrEvent === 'boolean')
      ? stateOrEvent
      : !!stateOrEvent?.target?.checked;
    this.toggleShowRemovedEvent.emit({ target: { checked } });
  }

  /**
   * Toggle showing suppressed vulnerabilities
   */
  toggleShowSuppressed(stateOrEvent: any): void {
    const checked = (typeof stateOrEvent === 'boolean')
      ? stateOrEvent
      : !!stateOrEvent?.target?.checked;
    this.toggleShowSuppressedEvent.emit({ target: { checked } });
  }

  /**
   * Toggle bulk action mode
   */
  toggleAdvancedOptions(): void {
    this.advancedOptionsVisible = !this.advancedOptionsVisible;
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

  goToCode(row: Vulnerability) {
    const link = this.getRepositoryLinkForRow(row);
    window.open(link, '_blank');
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.selectedSeverity = [];
    this.selectedSource = [];
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
  private getRepositoryLinkForRow(row: any): string {
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
  // === XLSX Export ===
  private formatDateForXlsx(d?: string | Date | null) {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '';
    return date.toISOString(); // Excel parses ISO
  }

  private mapRowForExport(row: any): Record<string, any> {
    return {
      Severity: row?.severity ?? '',
      Name: row?.name ?? '',
      Status: row?.status ?? '',
      Exploitability: Math.round(row?.predictedProbability * 100) ?? '',
      'Last Seen': this.formatDateForXlsx(row?.last_seen),
      Source: row?.source ?? '',
      Location: this.getFormattedLocationForRow(row),
    };
  }

  private buildFiltersSheet(): XLSX.WorkSheet {
    const filters: Array<{ Key: string; Value: any }> = [
      { Key: 'Branch', Value: this.selectedBranch || this.repoData?.defaultBranch?.name || '' },
      { Key: 'Status filter (header select)', Value: this.cf?.['status'] ?? '' },
      { Key: 'Severity', Value: this.cf?.['severity'] ?? '' },
      { Key: 'Name contains', Value: this.cf?.['name'] ?? '' },
      { Key: 'Source', Value: this.cf?.['source'] ?? '' },
      { Key: 'Location contains', Value: this.cf?.['location'] ?? '' },
      { Key: 'Show Removed toggle', Value: !!this.showRemoved },
      { Key: 'Show Suppressed toggle', Value: !!this.showSuppressed },
      { Key: 'Urgent Only toggle', Value: !!this.showUrgent },
      { Key: 'Notable Only toggle', Value: !!this.showNotable },
      { Key: 'StatusFilter (global)', Value: this.statusFilter ?? '' },
      { Key: 'Page Size (limit)', Value: this.vulnerabilitiesLimit ?? '' },
    ];

    const ws = XLSX.utils.json_to_sheet(filters);
    (ws as any)['!cols'] = [{ wch: 28 }, { wch: 50 }];
    return ws;
  }

  private getDataForExport(mode: 'filtered' | 'selected'): Vulnerability[] {
    if (mode === 'selected') {
      const selectedIds = new Set(this.selectedFindings ?? []);
      return (this.filteredVulns ?? []).filter((r: any) => selectedIds.has(r.id));
    }
    return this.filteredVulns ?? [];
  }

  public exportToExcel(mode: 'filtered' | 'selected' = 'filtered'): void {
    const rows = this.getDataForExport(mode);
    if (!rows?.length) { return; }

    const exportRows = rows.map(r => this.mapRowForExport(r));

    const wb = XLSX.utils.book_new();
    const wsData = XLSX.utils.json_to_sheet(exportRows, { dateNF: 'yyyy-mm-dd hh:mm' });
    const headers = Object.keys(exportRows[0] || {});
    (wsData as any)['!cols'] = headers.map(h => ({ wch: Math.max(12, h.length + 2) }));
    XLSX.utils.book_append_sheet(wb, wsData, mode === 'selected' ? 'Selected' : 'Filtered');

    const wsFilters = this.buildFiltersSheet();
    XLSX.utils.book_append_sheet(wb, wsFilters, 'Filters');

    const branchName = (this.selectedBranch || this.repoData?.defaultBranch?.name || 'branch')
      .toString()
      .replace(/[^\w.-]+/g, '_');

    const ts = new Date();
    const stamp = [
      ts.getFullYear(),
      String(ts.getMonth() + 1).padStart(2, '0'),
      String(ts.getDate()).padStart(2, '0'),
      String(ts.getHours()).padStart(2, '0'),
      String(ts.getMinutes()).padStart(2, '0'),
    ].join('');

    const fileName = `vulnerabilities_${branchName}_${mode}_${stamp}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  protected getRiskClass(predictedProbability: any) {
    if (predictedProbability == null) return this.themeService.getCssVariable('--gray-300');

    if (predictedProbability < environment.likelyExploitThreshold) return this.themeService.getCssVariable('--green-600');
    if (predictedProbability > environment.reachableExploitThreshold) return this.themeService.getCssVariable('--red-600');
    return this.themeService.getCssVariable('--yellow-600');
  }


  protected getTooltipValue(predictedProbability: any) {
    if (predictedProbability == null) return '';

    if (predictedProbability < environment.likelyExploitThreshold) return "Low risk of exploiting this vulnerability";
    if (predictedProbability > environment.reachableExploitThreshold) return "Very likely to exploit this vulnerability";
    return "There are additional conditions that must be met to exploit this vulnerability";
  }
}