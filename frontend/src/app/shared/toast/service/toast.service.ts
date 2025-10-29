import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {ToastStatus} from "../toast-status";

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private _visible = new BehaviorSubject<boolean>(false);
  private _status = new BehaviorSubject<ToastStatus>(ToastStatus.Success);
  private _message = new BehaviorSubject<string>("");
  private _header = new BehaviorSubject<string>("");
  private _delay = new BehaviorSubject<number>(5000);

  visible = this._visible.asObservable();
  status = this._status.asObservable();
  message = this._message.asObservable();
  header = this._header.asObservable();
  delay = this._delay.asObservable();

  show(message: string, status: ToastStatus, header: string = 'Notification', delay: number = 5000) {
    this._message.next(message);
    this._status.next(status);
    this._header.next(header);
    this._delay.next(delay);
    this._visible.next(true);
  }

  hide() {
    this._visible.next(false);
  }
}
