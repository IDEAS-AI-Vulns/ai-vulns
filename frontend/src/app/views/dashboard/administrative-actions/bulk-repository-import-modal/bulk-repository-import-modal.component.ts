import {Component, EventEmitter, Input, OnInit, Output, Signal} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Team} from "../../../../model/Models";
import {TeamService} from "../../../../service/team/team-service.service";

@Component({
  selector: 'app-bulk-repository-import-modal',
  templateUrl: './bulk-repository-import-modal.component.html',
  styleUrl: './bulk-repository-import-modal.component.scss'
})
export class BulkRepositoryImportModalComponent implements OnInit {

  @Input() visible: boolean = false;

  @Output() onFormSubmit = new EventEmitter<FormGroup>();

  protected importRepoForm!: FormGroup;
  protected selectedRepo: GitProvider = GitProvider.GitLab;
  protected Provider = GitProvider;
  protected teams!: Signal<Team[]>;

  constructor(private fb: FormBuilder,
              private teamService: TeamService) {
  }

  ngOnInit(): void {
    this.teams = this.teamService.teams;

    this.importRepoForm = this.fb.group({
      repoUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
      accessToken: ['', Validators.required],
      team: ['', Validators.required],
      repoType: [this.selectedRepo, Validators.required]
    });
  }

  protected selectRepoType(type: GitProvider) {
    this.selectedRepo = type;
  }

  protected onSubmit() {
    this.importRepoForm.value.repoType = this.selectedRepo;
    this.onFormSubmit.emit(this.importRepoForm);
  }

  protected visibleChange(event: boolean = false) {
    this.visible = event;
  }
}

export enum GitProvider {
  GitLab = 'GitLab',
  GitHub = 'GitHub'
}