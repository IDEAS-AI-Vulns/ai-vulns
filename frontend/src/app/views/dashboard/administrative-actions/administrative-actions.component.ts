import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-administrative-actions',
  templateUrl: './administrative-actions.component.html',
  styleUrl: './administrative-actions.component.scss'
})
export class AdministrativeActionsComponent {

  @Input() showCreateTeamButton?: boolean = true;

  @Output() bulkRepositoryImport: EventEmitter<boolean> = new EventEmitter();
  @Output() singleRepositoryImport: EventEmitter<boolean> = new EventEmitter();
  @Output() createTeam: EventEmitter<boolean> = new EventEmitter();

  constructor() {}

  bulkRepositoryImportButtonClicked() {
    //this.bulkRepositoryImport.emit(true);


  }

  singleRepositoryImportButtonClicked() {
    this.singleRepositoryImport.emit(true);
  }

  createTeamButtonClicked() {
    this.createTeam.emit(true);
  }
}
