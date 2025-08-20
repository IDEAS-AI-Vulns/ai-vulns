import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {CloudSubscription} from "../../views/dashboard/general-data-overview/cloud-subscriptions/cloud-subscription";
import {of} from "rxjs";
import {catchError} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class CloudService {

  private readonly http = inject(HttpClient);
  private readonly loginUrl = environment.backendUrl;

  private readonly _subscriptions = signal<CloudSubscription[]>([]);
  readonly subscriptions = computed(() => this._subscriptions());

  fetchCloudSubscriptions() {
    this.http.get<CloudSubscription[]>(this.loginUrl + '/api/v1/cloudsubscription/cloudsubscriptions',{ withCredentials: true }).pipe(
        catchError(err => {
          console.error('Failed to fetch settings', err);
          return  of([]);
        })
    ).subscribe(data => {
      this._subscriptions.set(data);
    });
  }
}


