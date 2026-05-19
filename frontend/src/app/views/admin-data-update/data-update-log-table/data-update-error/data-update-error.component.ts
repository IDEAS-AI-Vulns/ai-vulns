import {Component, Input} from '@angular/core';
import {NgForOf} from "@angular/common";
import {DataUpdateLogError} from "../../../../model/data-update-log-error";

@Component({
  selector: 'app-data-update-error',
  templateUrl: './data-update-error.component.html',
  standalone: true,
  imports: [NgForOf],
  styleUrl: './data-update-error.component.scss'
})
export class DataUpdateErrorComponent {
  @Input() errors!: DataUpdateLogError[];
}
