import {Component, inject, OnInit} from '@angular/core';
import {TableColumn} from "../../repositories/repositories-table/table-column";
import {DashboardService} from "../../../../../service/DashboardService";

@Component({
  selector: 'app-repository-providers-table',
  templateUrl: './repository-providers-table.component.html',
  styleUrl: './repository-providers-table.component.scss'
})
export class RepositoryProvidersTableComponent implements OnInit {

  protected visibleRows: any;
  protected columns: TableColumn[] = [];
  protected dashboardService = inject(DashboardService);

  ngOnInit(): void {
    this.columns = [
      { prop: 'providerType', name: 'Provider' },
      { prop: 'apiUrl', name: 'API URL' },
      { prop: 'defaultTeamName', name: 'Default Team' },
      { prop: 'lastSyncDate', name: 'Last Sync' },
      { prop: 'syncedRepoCount', name: 'Synced Repositories' }
    ];

    //TODO: move this to proper service
    this.dashboardService.getRepositoryProviders().subscribe({
      next: (data) => {
        this.visibleRows = data;
      },
      error: (err) => {
        console.error('Failed to load repository providers', err);
        //this.showToast('danger', 'Could not load repository providers.');
      }
    });
  }
}
