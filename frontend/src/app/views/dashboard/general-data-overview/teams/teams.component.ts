import { Component } from '@angular/core';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss'
})
export class TeamsComponent {

  protected currentFilter: string = '';

  filterTeamsTable($event: string) {
    this.currentFilter = $event;
  }
}
