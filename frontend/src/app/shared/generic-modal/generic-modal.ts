import {EventEmitter, Input, Output} from "@angular/core";

export abstract class GenericModal {

    @Input() visible: boolean = false;
    @Output() onModalClosed: EventEmitter<boolean> = new EventEmitter();

    protected dismissModal(event: boolean): void {
        this.visible = event;
        this.onModalClosed.emit(event);
    }

    protected closeModal(): void {
        this.visible = false;
        this.onModalClosed.emit(false);
    }
}
