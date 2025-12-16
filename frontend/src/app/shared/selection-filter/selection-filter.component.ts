import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-selection-filter',
  templateUrl: './selection-filter.component.html',
  styleUrls: ['./selection-filter.component.scss']
})
export class SelectionFilterComponent {

    @Input() title: string = '';
    @Input() selectedValues: string[] = [];
    @Input() values: string[] = [];

    @Output() onValueChange: EventEmitter<string> = new EventEmitter();

    toggleValue(value: string) {
        const index = this.selectedValues.indexOf(value);
        this.selectedValues = [];
        if (index === -1) {
            this.selectedValues.push(value);
            this.onValueChange.emit(this.selectedValues[0]);
        } else
            this.onValueChange.emit('');

    }
}
