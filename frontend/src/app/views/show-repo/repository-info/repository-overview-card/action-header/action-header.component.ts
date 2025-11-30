import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IconDirective} from "@coreui/icons-angular";
import {
  ButtonCloseDirective,
  ButtonDirective,
  FormControlDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  SpinnerComponent,
  TooltipDirective
} from "@coreui/angular";
import {NgIf} from "@angular/common";
import {RepoService} from "../../../../../service/RepoService";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-action-header',
  templateUrl: './action-header.component.html',
  standalone: true,
  imports: [
    IconDirective,
    ButtonDirective,
    NgIf,
    SpinnerComponent,
    TooltipDirective,
    ButtonCloseDirective,
    FormControlDirective,
    ModalBodyComponent,
    ModalComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ReactiveFormsModule,
    FormsModule
  ],
  styleUrl: './action-header.component.scss'
})
export class ActionHeaderComponent {
  @Input() repoData: any;
  @Input() scanRunning: boolean = false;
  @Input() userRole: string = 'USER';
  @Output() runScanEvent = new EventEmitter<void>();
  @Output() runExploitabilityEvent = new EventEmitter<void>();
  @Output() openChangeTeamModalEvent = new EventEmitter<void>();

  renameModalVisible = false;
  renameSaving = false;
  renameError: string | null = null;
  renameForm = { name: '' };

  constructor(private codeService: RepoService) {}

  openRenameModal() {
    this.renameError = null;
    this.renameForm.name = this.repoData?.name ?? '';
    this.renameModalVisible = true;
  }
  confirmRename() {
    const id = this.repoData?.id;
    if (!id) return;

    const trimmed = (this.renameForm.name || '').trim();
    if (!trimmed) {
      this.renameError = 'Name cannot be empty.';
      return;
    }

    // Optional client-side check mirroring backend
    const ok = /^[\p{L}\p{N} _.\-\/]{1,200}$/u.test(trimmed);
    if (!ok) {
      this.renameError = 'Invalid name. Allowed: letters, digits, space, _ . -';
      return;
    }

    this.renameSaving = true;
    this.codeService.rename(id, trimmed).subscribe({
      next: () => {
        if (this.repoData) this.repoData.name = trimmed; // optimistic UI update
        this.renameSaving = false;
        this.renameModalVisible = false;
      },
      error: (err) => {
        this.renameSaving = false;
        this.renameError = err?.error?.message || 'Rename failed.';
      }
    });
  }

  analyzeExploitability() {
    this.runExploitabilityEvent.emit();
  }

  runScan() {
    this.runScanEvent.emit();
  }

  openChangeTeamModal() {
    this.openChangeTeamModalEvent.emit();
  }
}
