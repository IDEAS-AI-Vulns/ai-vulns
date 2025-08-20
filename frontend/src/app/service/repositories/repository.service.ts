import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {CodeRepository} from "./code-repository";
import {catchError} from "rxjs/operators";
import {Observable, of} from "rxjs";
import {ImportRepository} from "../../views/dashboard/administrative-actions/repository-list-modal/import-repository";
import {ToastService} from "../toast/toast.service";
import {ToastStatus} from "../../shared/toast/toast-status";
import {
  GitProvider
} from "../../views/dashboard/administrative-actions/bulk-repository-import-modal/bulk-repository-import-modal.component";
import {GitProject} from "../git/git-project";
import {FormGroup} from "@angular/forms";

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {

  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private loginUrl = environment.backendUrl;

  private readonly _repositories = signal<CodeRepository[]>([]);
  readonly repositories = computed(() => this._repositories());

  fetchRepositories() {
    console.log('Fetch Repositories');

    this.http.get<CodeRepository[]>(this.loginUrl + '/api/v1/coderepo',{ withCredentials: true }).pipe(
        catchError(err => {
          console.error('Failed to fetch settings', err);
          return  of([]);
        })
    ).subscribe(data => {
      console.log('Data loaded', data);
      this._repositories.set(data);
    });
  }

  createRepository(gitRepository: GitProject, importRepositoryForm: FormGroup, repoType: GitProvider) {
    const repoObject: ImportRepository = {
      name: gitRepository.path_with_namespace,
      remoteId: gitRepository.id,
      repoUrl: importRepositoryForm.value.repoUrl,
      accessToken: importRepositoryForm.value.accessToken,
      team: importRepositoryForm.value.team,
    }

    this.http.post<any>(this.loginUrl + '/api/v1/coderepo/create/'+repoType.toLowerCase(), repoObject,{ withCredentials: true }).subscribe({
      next: data => {
        console.log('Data loaded', data);
        gitRepository.imported = true;
      },
      error: err => {
        this.toast.show("Failed to import repository", ToastStatus.Danger);
      }
    });
  }
}
