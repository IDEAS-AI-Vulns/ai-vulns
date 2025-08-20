import { Component } from '@angular/core';

@Component({
  selector: 'app-repositories',
  templateUrl: './repositories.component.html',
  styleUrl: './repositories.component.scss'
})
export class RepositoriesComponent {

  protected currentFilter: string = '';

  filterRepositoriesTable($event: string) {
    this.currentFilter = $event;
  }
}
