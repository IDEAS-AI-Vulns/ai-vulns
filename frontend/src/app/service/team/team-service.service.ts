import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Team} from "../../model/Models";
import {catchError} from "rxjs/operators";
import {environment} from "../../../environments/environment";
import {Observable, of} from "rxjs";
import {ToastService} from "../toast/toast.service";
import {CreateTeamDTO} from "./create-team-dto";
import {ToastStatus} from "../../shared/toast/toast-status";
import {RepositoryService} from "../repositories/repository.service";
import {CodeRepository} from "../repositories/code-repository";

interface ChangeTeamDto {
  id: number;
  users: number[];
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  private readonly repositoryService = inject(RepositoryService);

  private readonly loginUrl = environment.backendUrl;

  private readonly _teams = signal<Team[]>([]);
  readonly teams = computed(() => {
    const repos = this.repositoryService.repositories();
    return this._teams().map(team => {
      const teamRepos = repos.filter(repo => repo.team.toLowerCase() === team.name.toLowerCase());
      const { sast, sca, iac, secrets, dast, gitlab } = this.getRepoScanStatus(teamRepos);
      return {
        ...team,
        sastStatus: sast,
        scaStatus: sca,
        iacStatus: iac,
        secretsStatus: secrets,
        dastStatus: dast,
        gitlabStatus: gitlab
      };
    });
  });

  fetchTeams(): void {
    this.http.get<Team[]>(this.loginUrl + '/api/v1/team',{ withCredentials: true }).pipe(
        catchError(err => {
          console.error('Failed to fetch settings', err);
          return  of([]);
        })
    ).subscribe(data => {
      this._teams.set(data);
    });
  }

  private getRepoScanStatus(repos: CodeRepository[]): { sast: string, sca: string, iac: string, secrets: string, dast: string, gitlab:string } {
    const getStatus = (scanType: 'sast' | 'iac' | 'secrets' | 'sca' | 'dast' | 'gitlab'): string => {
      const statuses = repos.map(repo => repo[scanType]);
      if (statuses.includes('DANGER')) {
        return 'DANGER';
      } else if (statuses.includes('WARNING')) {
        return 'WARNING';
      } else if (statuses.every(status => status === 'NOT_PERFORMED')) {
        return 'NOT_PERFORMED';
      } else if (statuses.includes('SUCCESS')) {
        return 'SUCCESS';
      }
      return 'UNKNOWN'; // Default return value for unexpected cases
    };

    return {
      sast: getStatus('sast'),
      sca: getStatus('sca'),
      iac: getStatus('iac'),
      secrets: getStatus('secrets'),
      dast: getStatus('dast'),
      gitlab: getStatus('gitlab')
    };
  }


  create(createTeam: CreateTeamDTO): void {
    this.http.post<Team[]>(this.loginUrl + '/api/v1/team/create',createTeam, { withCredentials: true }).subscribe({
      next: () => {
        this.toast.show("Team created Successfully", ToastStatus.Success);
        this.fetchTeams();
      },
      error: err => {
        this.toast.show("Error during team creation, team already exist or You provided empty name.", ToastStatus.Danger);
      }
    });
  }

  createOld(createTeam: CreateTeamDTO): Observable<any> {
    return this.http.post<any>(this.loginUrl + '/api/v1/team/create', createTeam, { withCredentials: true });
  }

  get(): Observable<any> {
    return this.http.get<any>(this.loginUrl + '/api/v1/team',{ withCredentials: true });
  }

  getTeam(id: string): Observable<any> {
    return this.http.get<any>(this.loginUrl + '/api/v1/team/' + id ,{ withCredentials: true });
  }
  update(change: ChangeTeamDto): Observable<any> {
    return this.http.post<any>(this.loginUrl + '/api/v1/team', change, { withCredentials: true });
  }
  delete(id: number): Observable<any> {
    return this.http.delete(`/api/v1/team/${id}`);
  }
}
