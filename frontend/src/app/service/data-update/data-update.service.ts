import {Injectable, signal} from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {DataUpdateLog} from "../../model/data-update-log";
import {Observable} from "rxjs";
import {DataUpdateLogError} from "../../model/data-update-log-error";

@Injectable({
  providedIn: 'root'
})
export class DataUpdateService {

  private loginUrl = environment.backendUrl;
  private _logs = signal<DataUpdateLog[]>([]);
  readonly logs = this._logs.asReadonly();

  private _updateInProgress = signal<boolean>(false);
  readonly updateInProgress = this._updateInProgress.asReadonly();

  setLogs(logs: DataUpdateLog[]): void {
    this._logs.set(logs);
    this._updateInProgress.set(logs.length > 0 && logs.some(log => log.status === 'IN_PROGRESS'));
  }

  constructor(private http: HttpClient) {}

  loadDataLogs(): void {
    this.http.get<any>(this.loginUrl + '/api/v1/downloader/log',{ withCredentials: true }).subscribe({
      next: (response) => {
        this.setLogs(response);
      },
      error: (error) => {
        // Handle error
        console.error('Error loading code repos:', error);
      }
    });
  }

  loadDataLogErrors(id: number): Observable<DataUpdateLogError[]> {
    return this.http.get<any>(this.loginUrl + '/api/v1/downloader/log/' + id,{ withCredentials: true });
  }

  uploadData(data: any): Observable<string> {
    return this.http.post<any>(this.loginUrl + '/api/v1/downloader/update', data, { withCredentials: true });
  }

  downloadFile(id: string) {
    return this.http.get(
        `${this.loginUrl}/api/v1/downloader/file?id=${id}`,
        { withCredentials: true, responseType: 'blob' }
    );
  }

  addNewUpload() {
    this.setLogs([...this._logs(), {
      id: 0,
      createdDate: new Date(),
      status: 'IN_PROGRESS',
      processed: 0,
      error: 0,
      fileExists: false
    }]);
  }
}
