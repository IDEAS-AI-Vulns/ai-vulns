import {Component, inject, Input, ViewChild} from '@angular/core';
import {FormGroup} from "@angular/forms";
import {
  BulkRepositoryImportModalComponent,
  GitProvider
} from "./bulk-repository-import-modal/bulk-repository-import-modal.component";
import {GitService} from "../../../service/git/git.service";
import {RepositoryListModalComponent} from "./repository-list-modal/repository-list-modal.component";
import {
  SingleRepositoryImportModalComponent
} from "./single-repository-import-modal/single-repository-import-modal.component";
import {RepositoryService} from "../../../service/repositories/repository.service";
import {AddNewTeamModalComponent} from "./add-new-team-modal/add-new-team-modal.component";
import {CreateTeamDTO} from "../../../service/team/create-team-dto";
import {TeamService2} from "../../../service/team/team-service2.service";
import {ConnectProviderModalComponent} from "./connect-provider-modal/connect-provider-modal.component";
import {ChangeTeamModalComponent} from "./change-team-modal/change-team-modal.component";

@Component({
  selector: 'app-administrative-actions',
  templateUrl: './administrative-actions.component.html',
  styleUrl: './administrative-actions.component.scss'
})
export class AdministrativeActionsComponent {

  @Input() showCreateTeamButton?: boolean = true;

  @ViewChild(BulkRepositoryImportModalComponent)
  protected bulkRepositoryImportModal!: BulkRepositoryImportModalComponent;

  @ViewChild(RepositoryListModalComponent)
  protected repositoryListModal!: RepositoryListModalComponent;

  @ViewChild(SingleRepositoryImportModalComponent)
  protected singleRepositoryImportModal!: SingleRepositoryImportModalComponent;

  @ViewChild(AddNewTeamModalComponent)
  protected addNewTeamModal!: AddNewTeamModalComponent;

  @ViewChild(ConnectProviderModalComponent)
  protected connectProviderModalComponent!: ConnectProviderModalComponent;

  @ViewChild(ChangeTeamModalComponent)
  protected changeTeamModalComponent!: ChangeTeamModalComponent;


  private gitService = inject(GitService);
  private repositoryService= inject(RepositoryService);
  private teamService= inject(TeamService2);

  protected bulkRepositoryImportButtonClicked() {
    this.bulkRepositoryImportModal.visible = true;
  }
  protected onBulkRepositoryImportFormSubmit(bulkRepoImportForm: FormGroup) {
    if (bulkRepoImportForm.valid) {
      console.log('Returned with form ', bulkRepoImportForm.value);

      this.gitService.fetchAllRepositories( bulkRepoImportForm.value.repoType,
                                            bulkRepoImportForm.value.repoUrl,
                                            bulkRepoImportForm.value.accessToken);

      this.repositoryListModal.importRepositoryForm = bulkRepoImportForm;

      this.bulkRepositoryImportModal.visible = false;
      this.repositoryListModal.visible = true;
    }
  }

  protected singleRepositoryImportButtonClicked() {
    this.singleRepositoryImportModal.visible = true;
  }
  protected onSingleRepositoryImportFormSubmit(singleRepoImportForm: FormGroup) {
    if (singleRepoImportForm.valid) {
      console.log('Returned with form ', singleRepoImportForm.value);

      this.gitService.fetchRepositoryDetailsFromUrl(
          singleRepoImportForm.value.repoType,
          singleRepoImportForm.value.repoUrl,
          singleRepoImportForm.value.accessToken).subscribe({
        next: (response) => {
          this.repositoryService.createRepository(response, singleRepoImportForm, GitProvider.GitHub)
        },
        error: (error) => {
          console.error(error);
        }
      });

      this.singleRepositoryImportModal.visible = false;

    }
  }

  protected createTeamButtonClicked() {
    this.addNewTeamModal.visible = true;
  }
  protected onAddNewTeamFormSubmit(createTeam: CreateTeamDTO) {
    this.teamService.create(createTeam);
    this.addNewTeamModal.visible = false;
  }

  protected connectProviderButtonClicked() {
    this.connectProviderModalComponent.visible = true;
  }

  protected changeTeamButtonClicked() {
    this.changeTeamModalComponent.visible = true;
  }
}
