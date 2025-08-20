import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {GitProject} from "./git-project";
import {
  GitProvider
} from "../../views/dashboard/administrative-actions/bulk-repository-import-modal/bulk-repository-import-modal.component";
import {Observable, of, throwError} from "rxjs";
import {catchError, expand, finalize, map, reduce, takeWhile} from "rxjs/operators";
import {SpinnerService} from "../spinner/spinner.service";
import {RepositoryService} from "../repositories/repository.service";
import {ToastStatus} from "../../shared/toast/toast-status";
import {ToastService} from "../toast/toast.service";

@Injectable({
  providedIn: 'root'
})
export class GitService {

  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly spinner = inject(SpinnerService);
  private readonly repositories = inject(RepositoryService);

  private readonly _projects = signal<GitProject[]>([]);
  readonly projects = computed(() => this._projects());

  fetchAllRepositories(provider: GitProvider, url: string, token: string): void {
    this.spinner.show();
    const importedUrls = new Set(this.repositories.repositories().map(r => r.repo_url));
    this.getRepositoriesPaginated(token, provider, importedUrls)
        .pipe(
            finalize(() => {
              this.spinner.hide();
            })
        )
        .subscribe({
          next: repos => this._projects.set(repos),
          error: err => {
            console.error('Error fetching repos', err);
            this._projects.set([]);
          }
    });
  }

  //TODO: update to handle also GitLab
  private getRepositories(token: string, page: number = 1): Observable<any[]> {
    const headers = new HttpHeaders({ Authorization: `token ${token}` });
    const url = `https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&page=${page}&per_page=100`;

    return this.http.get<any[]>(url, { headers }).pipe(
        catchError(() => of([])) // return empty page on error
    );
  }

  private getRepositoriesPaginated(token: string, provider: GitProvider, importedUrls: Set<string>): Observable<GitProject[]> {
    const getPage = (page: number) => this.getRepositories(token, page);

    return getPage(1).pipe(
        expand((repos, index) => repos.length && index < 9 ? getPage(index + 2) : of([])),
        takeWhile((repos, index) => repos.length > 0 && index < 10),
        reduce<any[], any[]>((acc, curr) => acc.concat(curr), []),
        map(repos => repos.map(repo => ({
          id: repo.id,
          name: repo.name,
          path_with_namespace: repo.full_name,
          web_url: repo.html_url,
          //imported: importedUrls.has(repo.html_url),
          imported: false,
          type: provider
        })))
    );
  }

  fetchRepositoryDetailsFromUrl(provider: GitProvider, repoUrl: string, token: string): Observable<GitProject> {
        const repoPath = this.extractRepositoryPath(repoUrl);
        const url = `https://api.github.com/repos/${repoPath}`;

        const headers = new HttpHeaders({
            'Authorization': `token ${token}`
        });

        return this.http.get<any>(url, { headers }).pipe(
              map(response => ({
                  id: response.id,
                  name: response.name,
                  path_with_namespace: response.full_name,
                  web_url: response.html_url,
                  type: provider,
                  imported: false
              })),
              catchError(err => {
                  this.toast.show("Failed to import repository", ToastStatus.Danger);
                  return throwError(() => err); // propagate error to caller
              })
          );
    }

    private extractRepositoryPath(repoUrl: string): string {
        return repoUrl.replace(/https?:\/\/[^\/]+\//, '');
    }
}
