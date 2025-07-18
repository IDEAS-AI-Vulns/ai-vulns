import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent {

  @Input() placeholder: string = '';
  @Output() onSearchBarUpdate = new EventEmitter<any>();

  protected searchBarUpdate(event: any) {
    this.onSearchBarUpdate.emit(event);
  }
}
