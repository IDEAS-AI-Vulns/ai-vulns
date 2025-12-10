import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-info-tile',
  templateUrl: './info-tile.component.html',
  styleUrl: './info-tile.component.css'
})
export class InfoTileComponent {

  @Input() color: string = '#ffffff';
  @Input() header: string = '';
  @Input() value: string = '';
  @Input() description: string = '';
}
