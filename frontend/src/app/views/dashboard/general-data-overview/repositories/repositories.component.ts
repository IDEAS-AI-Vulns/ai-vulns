import {Component} from '@angular/core';
import {CodeRepository} from "../../../../service/repositories/code-repository";

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

  selectedRepositoriesChange($event: CodeRepository[]) {
    //TODO: handle storage of selected Repositories
    //this.onRepositorySelectionChange.emit($event);
  }
}
