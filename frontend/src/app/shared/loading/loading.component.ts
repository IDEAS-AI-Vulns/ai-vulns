import {Component, inject} from '@angular/core';
import {SpinnerService} from "../../service/spinner/spinner.service";

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent {

  protected loadingService = inject(SpinnerService);
}
