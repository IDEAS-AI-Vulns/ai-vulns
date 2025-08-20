import {Component, Input} from '@angular/core';
import {ToastStatus} from "./toast-status";
import {ToastService} from "../../service/toast/toast.service";

@Component({
  selector: 'app-toast-application',
  templateUrl: './toast-application.component.html',
  styleUrl: './toast-application.component.scss'
})
export class ToastApplicationComponent {

  protected visible: boolean = false;
  protected status: ToastStatus = ToastStatus.Success;
  protected message: string = "";
  protected delay: number = 5000;
  protected header: string = "Notification";

  constructor(private toastService: ToastService) {
    this.toastService.visible.subscribe(visible => this.visible = visible);
    this.toastService.status.subscribe(status => this.status = status);
    this.toastService.message.subscribe(message => this.message = message);
    this.toastService.delay.subscribe(delay => this.delay = delay);
    this.toastService.header.subscribe(header => this.header = header);
  }

  protected onVisibleChange(event: boolean){
    if (!event) {
      this.toastService.hide(); // to reset the visibility state
    }
  }
}
