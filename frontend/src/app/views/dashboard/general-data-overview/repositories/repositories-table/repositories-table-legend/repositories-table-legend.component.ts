import { Component } from '@angular/core';

@Component({
  selector: 'app-repositories-table-legend',
  templateUrl: './repositories-table-legend.component.html',
  styleUrl: './repositories-table-legend.component.scss'
})
export class RepositoriesTableLegendComponent {

    protected visible: boolean = false;

    protected toggleStatusLegend() {
        this.visible = !this.visible;
    }
}
