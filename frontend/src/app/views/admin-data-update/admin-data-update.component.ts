import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {ColComponent, RowComponent} from "@coreui/angular";
import {SharedModule} from "../../shared/shared.module";
import {DataUpdateLogTableComponent} from "./data-update-log-table/data-update-log-table.component";
import {DataUpdateService} from "../../service/data-update/data-update.service";
import {DataProvisionComponent} from "./data-provision/data-provision.component";
import {ToastService} from "../../shared/toast/service/toast.service";
import {ToastStatus} from "../../shared/toast/toast-status";
import {ToastApplicationComponent} from "../../shared/toast/toast-application.component";
import {interval, Subscription} from "rxjs";

@Component({
  selector: 'app-admin-data-update',
  templateUrl: './admin-data-update.component.html',
  styleUrl: './admin-data-update.component.scss',
  standalone: true,
    imports: [
        ColComponent,
        RowComponent,
        SharedModule,
        DataUpdateLogTableComponent,
        DataProvisionComponent,
        ToastApplicationComponent
    ]
})
export class AdminDataUpdateComponent implements OnInit, OnDestroy {

  readonly dataUpdateService = inject(DataUpdateService);
  logs = this.dataUpdateService.logs;
  updateInProgress = this.dataUpdateService.updateInProgress;

  readonly toastService = inject(ToastService);

  private logStatusSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.dataUpdateService.loadDataLogs();
  }

  ngOnDestroy() {
      if (this.logStatusSubscription) {
          this.logStatusSubscription.unsubscribe();
      }
    }

  protected onDataUploaded($event: any) {
    this.dataUpdateService.uploadData($event).subscribe(
        () => {
          this.toastService.show('Processing of data started successfully', ToastStatus.Success);
          this.dataUpdateService.loadDataLogs();
          this.logStatusSubscription = interval(30 * 1000).subscribe(() => {
              this.updateData();
          });
        },
        (error) => {
          this.toastService.show('Processing of data encountered an error', ToastStatus.Danger);
          this.dataUpdateService.loadDataLogs();
        }
    );
  }

  protected updateData() {
      if(this.logs().length > 0 && this.logs()[this.logs().length-1].status === 'IN_PROGRESS') {
          this.dataUpdateService.loadDataLogs();
      }
  }

  protected onDownloadFile($event: string) {
    this.dataUpdateService.downloadFile($event).subscribe(
        (content) => {
          const url = window.URL.createObjectURL(content);

          const a = document.createElement('a');
          a.href = url;
          a.download = `${$event}.json`;
          a.click();

          window.URL.revokeObjectURL(url);
        },
        (error) => {
          console.error('Error downloading file:', error);
        }
    )
  }
}
