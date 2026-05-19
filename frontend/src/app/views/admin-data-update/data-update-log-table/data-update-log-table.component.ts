import {Component, EventEmitter, inject, Input, Output, Signal, ViewChild} from '@angular/core';
import {DatatableComponent, NgxDatatableModule, TableColumn} from "@swimlane/ngx-datatable";
import {DataUpdateLog} from "../../../model/data-update-log";
import {DatePipe} from "@angular/common";
import {IconDirective} from "@coreui/icons-angular";
import {DataUpdateErrorComponent} from "./data-update-error/data-update-error.component";
import {DataUpdateLogError} from "../../../model/data-update-log-error";
import {DataUpdateService} from "../../../service/data-update/data-update.service";

@Component({
  selector: 'app-data-update-log-table',
  templateUrl: './data-update-log-table.component.html',
  styleUrl: './data-update-log-table.component.scss',
  standalone: true,
  imports: [
    NgxDatatableModule,
    DatePipe,
    IconDirective,
    DataUpdateErrorComponent
  ]
})
export class DataUpdateLogTableComponent {

  @Input() logs!: Signal<DataUpdateLog[]>;
  @Output() downloadFileEvent = new EventEmitter<string>();

  @ViewChild(DatatableComponent) table!: DatatableComponent;

  private dataUpdateService = inject(DataUpdateService);

  protected columns: TableColumn[] = [
    {prop: 'createdDate', name: 'Import Date'},
    {prop: 'status', name: 'Status'},
    {prop: 'processed', name: 'Successfully processed'},
    {prop: 'error', name: 'Not processed'},
  ];

  protected downloadFile(id: string) {
    this.downloadFileEvent.emit(id);
  }

  protected showProcessingErrors(row: DataUpdateLog) {
    this.dataUpdateService.loadDataLogErrors(row.id).subscribe({
      next: (data: DataUpdateLogError[]) => {
        console.log('Processing errors:', data);
        row.errors = data;
        this.table.rowDetail.toggleExpandRow(row);
      },
      error: (err) => {
        console.error('Error fetching processing errors', err);
        // Even on error we might want to toggle it to show "no errors" or something,
        // but let's stick to the requirement.
      }
    });
  }

  protected getDetailRowHeight(row: any) {
    return undefined;
  }
}