import {Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

  private _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  show() {
    console.log('Showing...');
    this._loading.set(true);
  }

  hide() {
    console.log('Hideing...');
    this._loading.set(false);
  }

  toggle() {
    this._loading.update(value => !value);
  }
}
