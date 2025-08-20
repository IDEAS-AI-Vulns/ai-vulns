import {Component, effect, EventEmitter, inject, input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {RepositoryService} from "../../../../../service/repositories/repository.service";
import {TableColumn} from "./table-column";
import {Router} from "@angular/router";
import {ToastService} from "../../../../../service/toast/toast.service";
import {ToastStatus} from "../../../../../shared/toast/toast-status";
import {CodeRepository} from "../../../../../service/repositories/code-repository";
import {SelectionType} from "@swimlane/ngx-datatable";

@Component({
  selector: 'app-repositories-table',
  templateUrl: './repositories-table.component.html',
  styleUrl: './repositories-table.component.scss'
})
export class RepositoriesTableComponent implements OnInit {

  readonly filter = input<string>();

  protected readonly repositoryService = inject(RepositoryService);
  private readonly toastService = inject(ToastService);

  protected columns: TableColumn[] = [];
  protected visibleRepositories: CodeRepository[] = [];
  protected selectedRepos: CodeRepository[] = [];
  protected selectionType = SelectionType;

  @ViewChild('actionsTemplate', {static: true}) actionsTemplate!: TemplateRef<any>;
  @Output() onSelectionChange = new EventEmitter<CodeRepository[]>();

  constructor(private router: Router) {
    effect(() => {
      const value = this.filter();  // 👈 this will re-run whenever input changes
      this.filterTable(value);
    });
  }

  ngOnInit(): void {
    this.columns = [
      {name: 'Actions', cellTemplate: this.actionsTemplate},
      {name: 'Target', prop: 'target'},
      {name: 'Team', prop: 'team'},
      {name: 'Apps', prop: 'apps'},
      {name: 'Risk', prop: 'risk'}
    ];

    this.visibleRepositories = this.repositoryService.repositories();
  }

  protected rowIdentity = (row: CodeRepository): any => {
    return row.id;
  };

  protected showRepository(row: any) {
    this.router.navigate(['/show-repo/' + row.id]).then(success => {
      if (!success) {
        this.toastService.show('Could not perform navigation', ToastStatus.Danger);
      }
    });
  }

  protected filterTable(value: any): void {
    const currentFilter = value.toLowerCase();

    // If there's no filter value, reset rows to full list
    if (!currentFilter) {
      this.visibleRepositories = this.repositoryService.repositories();
      return;
    }

    // Filter our data based on multiple columns
    this.visibleRepositories = this.visibleRepositories.filter(row => {
      // Ensure you filter based on all the relevant columns
      return (
          row.target.toLowerCase().includes(currentFilter) ||
          row.team.toLowerCase().includes(currentFilter) ||
          row.sast.toLowerCase().includes(currentFilter) ||
          row.sca.toLowerCase().includes(currentFilter) ||
          row.secrets.toLowerCase().includes(currentFilter) ||
          row.iac.toLowerCase().includes(currentFilter) ||
          row.gitlab.toLowerCase().includes(currentFilter)
      );
    });
  }

  onSelect({ selected }: { selected: any[] }) {
    // This creates a new array reference, which is a clearer signal to Angular
    // that the data has changed.
    console.log('Select event fired:', selected);

    this.selectedRepos = [...selected];
    this.onSelectionChange.emit(this.selectedRepos);
  }

  /**
   * Determines the overall risk status by finding the highest severity among all scans.
   * The order of severity is DANGER > RUNNING > WARNING > SUCCESS > NOT_PERFORMED.
   * @param row The repository data row.
   * @returns The highest severity status string.
   */
  getOverallRiskStatus(row: CodeRepository): string {
    const statuses = [row.sast, row.dast, row.sca, row.secrets, row.iac, row.gitlab];
    if (statuses.includes('DANGER')) return 'DANGER';
    if (statuses.includes('RUNNING')) return 'RUNNING';
    if (statuses.includes('WARNING')) return 'WARNING';
    if (statuses.includes('SUCCESS')) return 'SUCCESS';
    return 'NOT_PERFORMED';
  }

  /**
   * Returns the appropriate CSS class for a scan block's background color.
   * @param status The status string of a single scan (e.g., 'DANGER').
   * @returns A string with the status class (e.g., 'status-danger').
   */
  getScanStatusClass(status: string): string {
    if (!status) return 'status-neutral';
    switch (status.toUpperCase()) {
      case 'DANGER':
        return 'status-danger';
      case 'WARNING':
        return 'status-warning';
      case 'SUCCESS':
        return 'status-success';
      case 'RUNNING':
        return 'status-running';
      case 'NOT_PERFORMED':
      default:
        return 'status-neutral';
    }
  }

  /**
   * Returns the appropriate CSS class for the overall risk indicator's color.
   * @param row The repository data row.
   * @returns A string with the text color class (e.g., 'text-danger').
   */
  getOverallRiskClass(row: CodeRepository): string {
    const status = this.getOverallRiskStatus(row);
    switch (status) {
      case 'DANGER':
        return 'text-danger';
      case 'WARNING':
        return 'text-warning';
      case 'SUCCESS':
        return 'text-success';
      case 'RUNNING':
        return 'text-primary';
      default:
        return 'text-muted';
    }
  }

  /**
   * Returns the CoreUI icon name based on the overall risk status.
   * @param row The repository data row.
   * @returns A string with the icon name (e.g., 'cil-shield-alt').
   */
  getOverallRiskIcon(row: CodeRepository): string {
    const status = this.getOverallRiskStatus(row);
    switch (status) {
      case 'DANGER':
        return 'cil-warning';
      case 'WARNING':
        return 'cil-shield-alt';
      case 'SUCCESS':
        return 'cil-check-circle';
      case 'RUNNING':
        return 'cil-running';
      default:
        return 'cil-ban';
    }
  }
}
