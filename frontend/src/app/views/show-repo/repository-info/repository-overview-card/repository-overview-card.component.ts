import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CardBodyComponent, CardHeaderComponent} from "@coreui/angular";
import {DatePipe} from "@angular/common";
import {IconDirective} from "@coreui/icons-angular";
import {SharedModule} from "../../../../shared/shared.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RepoService} from "../../../../service/RepoService";
import {LanguageBreakdownComponent} from "./language-breakdown/language-breakdown.component";
import {ActionHeaderComponent} from "./action-header/action-header.component";

@Component({
  selector: 'app-repository-overview-card',
  templateUrl: './repository-overview-card.component.html',
  standalone: true,
  imports: [
    CardBodyComponent,
    CardHeaderComponent,
    DatePipe,
    IconDirective,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    LanguageBreakdownComponent,
    ActionHeaderComponent
  ],
  styleUrl: './repository-overview-card.component.scss'
})
export class RepositoryOverviewCardComponent {
  @Input() repoData: any;
  @Input() scanRunning: boolean = false;
  @Input() userRole: string = 'USER';
  @Input() topLanguages: { name: string; value: number; color: string }[] = [];

  @Output() runScanEvent = new EventEmitter<void>();
  @Output() runExploitabilityEvent = new EventEmitter<void>();
  @Output() openChangeTeamModalEvent = new EventEmitter<void>();

  renameModalVisible = false;
  renameSaving = false;
  renameError: string | null = null;
  renameForm = { name: '' };

  constructor(private codeService: RepoService) {}

  runScan(): void {
    this.runScanEvent.emit();
  }

  openChangeTeamModal(): void {
    this.openChangeTeamModalEvent.emit();
  }

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
}
