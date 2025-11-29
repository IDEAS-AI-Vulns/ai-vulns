import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-foldable-container',
  templateUrl: './foldable-container.component.html',
  styleUrl: './foldable-container.component.css'
})
export class FoldableContainerComponent {

  @Input() title: string = '';
  @Input() description?: string = '';
  @Input() isFoldable?: boolean = false;
  @Input() isVisible?: boolean = true;

  @Output() onToggled = new EventEmitter<boolean>();


  protected toggleContainer() {
    this.isVisible = !this.isVisible;
    this.onToggled.emit(this.isVisible);
  }
}