import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Team} from "../../model/Models";
import {catchError} from "rxjs/operators";
import {environment} from "../../../environments/environment";
import {of} from "rxjs";
import {ToastService} from "../toast/toast.service";
import {CreateTeamDTO} from "./create-team-dto";
import {ToastStatus} from "../../shared/toast/toast-status";

@Injectable({
  providedIn: 'root'
})
export class TeamService2 {

  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly loginUrl = environment.backendUrl;

  private readonly _teams = signal<Team[]>([]);
  readonly teams = computed(() => this._teams());

  fetchTeams(): void {
    this.http.get<Team[]>(this.loginUrl + '/api/v1/team',{ withCredentials: true }).pipe(
        catchError(err => {
          console.error('Failed to fetch settings', err);
          return  of([]);
        })
    ).subscribe(data => {
      console.log('Data loaded', data);
      this._teams.set(data);
    });
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
}
