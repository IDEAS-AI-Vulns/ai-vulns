import {Component, Input} from '@angular/core';
import {GitService} from "../../../../service/git/git.service";
import {ImportRepository} from "./import-repository";
import {FormGroup} from "@angular/forms";
import {ToastService} from "../../../../service/toast/toast.service";
import {ToastStatus} from "../../../../shared/toast/toast-status";
import {GitProject} from "../../../../service/git/git-project";
import {RepositoryService} from "../../../../service/repositories/repository.service";

@Component({
  selector: 'app-repository-list-modal',
  templateUrl: './repository-list-modal.component.html',
  styleUrl: './repository-list-modal.component.scss'
})
export class RepositoryListModalComponent {

    @Input() visible: boolean = false;
    @Input() importRepositoryForm!: FormGroup;

    protected isLoading: boolean = false;
    protected repositories = this.gitService.projects;

    constructor(private gitService: GitService,
                private repositoryService: RepositoryService) {
    }

    protected onImportRepository(gitRepository: GitProject) {
        this.repositoryService.createRepository(gitRepository, this.importRepositoryForm, gitRepository.type)
        /*
                        this.loadCodeRepos();
                this.loadSecurityData(); // Reload security data after adding a repository
         */
    }

    protected visibleChange(event: boolean = false) {
        this.visible = event;
    }
}
