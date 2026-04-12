import {computed, inject, Injectable, signal} from '@angular/core';
import {CodeRepo} from "../../model/CodeRepo";
import {DashboardService} from "../DashboardService";

export interface CodeRepoTableFilters {
  exploitabilityStatus?: string;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CodeRepoTableService {

  private _codeRepos = signal<CodeRepo[]>([]);
  private _filters = signal<CodeRepoTableFilters>({});
  private _selectedRepos = signal<CodeRepo[]>([]);

  readonly codeRepos = this._codeRepos.asReadonly();
  readonly selectedRepos = this._selectedRepos.asReadonly();

  readonly filteredCodeRepos = computed(() => {
    const allCodeRepos = this._codeRepos();
    const filters = this._filters();

    return allCodeRepos.filter(repo => {
      if (filters.exploitabilityStatus) {
        if (repo.exploitability !== filters.exploitabilityStatus) {
          return false;
        }
      }

      if (filters.searchTerm) {
        const val = filters.searchTerm.toLowerCase();
        const matchesSearch =
          (repo.target?.toLowerCase().includes(val) || false) ||
          (repo.team?.toLowerCase().includes(val) || false) ||
          (repo.sast?.toLowerCase().includes(val) || false) ||
          (repo.sca?.toLowerCase().includes(val) || false) ||
          (repo.secrets?.toLowerCase().includes(val) || false) ||
          (repo.iac?.toLowerCase().includes(val) || false) ||
          (repo.gitlab?.toLowerCase().includes(val) || false) ||
          (repo.dast?.toLowerCase().includes(val) || false);

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  })

  setCodeRepos(codeRepos: CodeRepo[]): void {
    this._codeRepos.set(codeRepos);
  }

  setSelectedRepos(repos: CodeRepo[]): void {
    this._selectedRepos.set(repos);
  }

  clearSelection(): void {
    this._selectedRepos.set([]);
  }

  updateFilters(filters: Partial<CodeRepoTableFilters>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }

  readonly dashboardService = inject(DashboardService);
  loadCodeRepos(): void {
    this.dashboardService.getRepos().subscribe({
      next: (response) => {
        this.setCodeRepos(response);
      },
      error: (error) => {
        // Handle error
        console.error('Error loading code repos:', error);
      }
    });
  }
}
