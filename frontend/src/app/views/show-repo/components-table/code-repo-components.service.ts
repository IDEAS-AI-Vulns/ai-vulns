import {computed, inject, Injectable, signal} from '@angular/core';
import {CodeRepoComponent} from "../../../model/CodeRepoComponent";
import {RepoService} from "../../../service/RepoService";

export interface CodeRepoComponentsTableFilters {
  name?: string;
  groupId?: string;
  version?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CodeRepoComponentsService {

  private _codeRepoComponents = signal<CodeRepoComponent[]>([]);
  private _filters = signal<CodeRepoComponentsTableFilters>({});
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  readonly codeRepoComponents = this._codeRepoComponents.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly filteredCodeRepoComponents = computed(() => {
    const allCodeRepoComponents = this._codeRepoComponents();
    const filters = this._filters();

    return allCodeRepoComponents.filter(component => {
      if (filters.name) {
        if (!component.name?.toLowerCase().includes(filters.name.toLowerCase())) {
          return false;
        }
      }

      if (filters.groupId) {
        if (!component.groupId?.toLowerCase().includes(filters.groupId.toLowerCase())) {
          return false;
        }
      }

      if (filters.version) {
        if (!component.version?.toLowerCase().includes(filters.version.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  })

  setCodeRepoComponents(codeRepoComponents: CodeRepoComponent[]): void {
    this._codeRepoComponents.set(codeRepoComponents);
  }

  updateFilters(filters: Partial<CodeRepoComponentsTableFilters>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }

  clearFilters(): void {
    this._filters.set({});
  }

  readonly repoService = inject(RepoService);
  loadCodeRepoComponents(id: number): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._codeRepoComponents.set([]);
    this.repoService.getComponentsDefBranch(id).subscribe({
      next: (response) => {
        this.setCodeRepoComponents(response);
        this._isLoading.set(false);
      },
      error: (error) => {
        this._isLoading.set(false);
        this._error.set('Failed to load components. Please contact administrator or try again later.');
        console.error('Error loading code repos:', error);
      }
    });
  }
}
