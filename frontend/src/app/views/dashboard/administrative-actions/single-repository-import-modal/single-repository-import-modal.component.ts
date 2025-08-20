import {Component, EventEmitter, Input, OnInit, Output, Signal} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {TeamService2} from "../../../../service/team/team-service2.service";
import {Team} from "../../../../model/Models";
import {GitProvider} from "../bulk-repository-import-modal/bulk-repository-import-modal.component";

@Component({
  selector: 'app-single-repository-import-modal',
  templateUrl: './single-repository-import-modal.component.html',
  styleUrl: './single-repository-import-modal.component.scss'
})
export class SingleRepositoryImportModalComponent implements OnInit {

  @Input() visible: boolean = false;
  @Output() onFormSubmit = new EventEmitter<FormGroup>();

  protected importRepoForm!: FormGroup;
  protected selectedRepo: GitProvider = GitProvider.GitLab;
  protected Provider = GitProvider;
  protected teams!: Signal<Team[]>;

  constructor(private fb: FormBuilder,
              private teamService: TeamService2) {
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

  protected onSubmit() {
    this.importRepoForm.value.repoType = this.selectedRepo;
    this.onFormSubmit.emit(this.importRepoForm);
  }

  protected selectRepoType(type: GitProvider) {
    this.selectedRepo = type;
  }

  protected visibleChange(event: boolean = false) {
    this.visible = event;
  }
}
