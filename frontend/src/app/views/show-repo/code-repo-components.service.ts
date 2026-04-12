import {computed, inject, Injectable, signal} from '@angular/core';
import {CodeRepoComponent} from "../../model/CodeRepoComponent";
import {RepoService} from "../../service/RepoService";

export interface CodeRepoComponentsTableFilters {
  exploitabilityStatus?: string;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CodeRepoComponentsService {

  private _codeRepoComponents = signal<CodeRepoComponent[]>([]);
  private _filters = signal<CodeRepoComponentsTableFilters>({});

  readonly codeRepoComponents = this._codeRepoComponents.asReadonly();

  readonly filteredCodeRepoComponents = computed(() => {
    const allCodeRepoComponents = this._codeRepoComponents();
    const filters = this._filters();

    return allCodeRepoComponents.filter(repo => {
      /*if (filters.exploitabilityStatus) {
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
      }*/

      return true;
    });
  })

  setCodeRepoComponents(codeRepoComponents: CodeRepoComponent[]): void {
    this._codeRepoComponents.set(codeRepoComponents);
  }

  updateFilters(filters: Partial<CodeRepoComponentsTableFilters>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }

  readonly repoService = inject(RepoService);
  loadCodeRepoComponents(id: number): void {
    this.repoService.getComponentsDefBranch(id).subscribe({
      next: (response) => {
        this.setCodeRepoComponents(response);
      },
      error: (error) => {
        // Handle error
        console.error('Error loading code repos:', error);
      }
    });
  }
}
