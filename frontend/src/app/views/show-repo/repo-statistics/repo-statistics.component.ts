import {Component} from '@angular/core';
import {ColComponent, RowComponent} from "@coreui/angular";
import {SharedModule} from "../../../shared/shared.module";

@Component({
  selector: 'app-repo-statistics',
  templateUrl: './repo-statistics.component.html',
  standalone: true,
  imports: [
    RowComponent,
    ColComponent,
    SharedModule
  ],
  styleUrl: './repo-statistics.component.css'
})
export class RepoStatisticsComponent {

}
