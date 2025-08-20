import {Component, effect, inject, input, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {RepositoryService} from "../../../../../service/repositories/repository.service";
import {TableColumn} from "./table-column";
import {Router} from "@angular/router";
import {ToastService} from "../../../../../service/toast/toast.service";
import {ToastStatus} from "../../../../../shared/toast/toast-status";
import {CodeRepository} from "../../../../../service/repositories/code-repository";

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

  @ViewChild('actionsTemplate', {static: true}) actionsTemplate!: TemplateRef<any>;

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
}
