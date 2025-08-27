import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {TeamService} from "../../../../service/team/team-service.service";
import {ToastService} from "../../../../service/toast/toast.service";

@Component({
  selector: 'app-change-team-modal',
  templateUrl: './change-team-modal.component.html',
  styleUrl: './change-team-modal.component.scss'
})
export class ChangeTeamModalComponent implements OnInit {

  @Input() visible: boolean = false;

  @Output() onFormSubmit = new EventEmitter<any>();

  protected readonly teamService = inject(TeamService);
  protected readonly toastService = inject(ToastService);

  protected changeTeamForm!: FormGroup;

  constructor(private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.changeTeamForm = this.fb.group({
      newTeamId: ['', Validators.required]
    });
  }

  protected visibleChange(event: boolean = false) {
    this.visible = event;
  }

  protected onSubmitChangeTeam() {
    //TODO: Handle this change
    /*if (this.changeTeamForm.invalid) {
      this.showToast('danger', 'Please select a new team.');
      return;
    }
    if (this.selectedRepos.length === 0) {
      this.showToast('danger', 'No repositories selected.');
      return;
    }

    const repoIds = this.selectedRepos.map(repo => repo.id);
    const { newTeamId } = this.changeTeamForm.value;

    this.dashboardService.changeTeamForRepos(repoIds, newTeamId).subscribe({
      next: () => {
        this.showToast('success', 'Teams changed successfully for selected repositories.');
        this.visibleChangeTeamModal = false;
        this.selectedRepos = []; // Clear selection
        this.loadCodeRepos(); // Refresh the repository list
      },
      error: (err) => {
        this.showToast('danger', `Error changing teams: ${err.error?.message || 'Please try again.'}`);
      }
    });*/
  }
}

