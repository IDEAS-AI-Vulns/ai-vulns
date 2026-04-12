import {Component, inject, Input, OnInit} from '@angular/core';
import {
  BadgeComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  SpinnerComponent,
  TooltipDirective
} from "@coreui/angular";
import {FormsModule} from "@angular/forms";
import {IconDirective} from "@coreui/icons-angular";
import {NgIf} from "@angular/common";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {CodeRepoComponentsService} from "./code-repo-components.service";

@Component({
  selector: 'app-components-table',
  templateUrl: './components-table.component.html',
  standalone: true,
  imports: [
    BadgeComponent,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    FormsModule,
    IconDirective,
    NgIf,
    NgxDatatableModule,
    TooltipDirective,
    SpinnerComponent
  ],
  styleUrl: './components-table.component.scss'
})
export class ComponentsTableComponent implements OnInit {

  readonly codeRepoComponentsService = inject(CodeRepoComponentsService);
  codeRepoComponents = this.codeRepoComponentsService.filteredCodeRepoComponents;
  isLoading = this.codeRepoComponentsService.isLoading;
  error = this.codeRepoComponentsService.error;
  componentsLimit = 10;
  private _repoId!: number;

  @Input() set repoId(value: number) {
    this._repoId = value;
    if (value) {
      this.loadCodeRepoComponents(value);
    }
  }

  get repoId(): number {
    return this._repoId;
  }

  ngOnInit(): void {
  }

  loadCodeRepoComponents(repoId: number) {
    this.codeRepoComponentsService.loadCodeRepoComponents(repoId);
  }

  updateFilterGroup(event: any) {
    this.codeRepoComponentsService.updateFilters({ groupId: event.target.value });
  }

  updateFilterNameNew(event: any) {
    this.codeRepoComponentsService.updateFilters({ name: event.target.value });
  }

  updateFilterVersion(event: any) {
    this.codeRepoComponentsService.updateFilters({ version: event.target.value });
  }

  clearComponentFilters() {
    this.codeRepoComponentsService.clearFilters();
  }
}
