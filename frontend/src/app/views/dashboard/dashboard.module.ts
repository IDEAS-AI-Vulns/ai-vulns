import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InfoTileStaticComponent} from "./security-overwiev/info-tile-static/info-tile-static.component";
import {IconDirective} from "@coreui/icons-angular";
import {RouterLink} from "@angular/router";
import {SecurityOverviewComponent} from "./security-overwiev/security-overview.component";
import {
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    FormControlDirective,
    FormDirective,
    FormSelectDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    ModalBodyComponent,
    ModalComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    RowComponent,
    SpinnerComponent,
    TabDirective,
    TabPanelComponent,
    TabsComponent,
    TabsContentComponent,
    TabsListComponent,
    TooltipDirective
} from "@coreui/angular";
import {ChartjsComponent} from "@coreui/angular-chartjs";
import {SharedModule} from "../../shared/shared.module";
import {AdministrativeActionsComponent} from "./administrative-actions/administrative-actions.component";
import {GeneralDataOverviewComponent} from "./general-data-overview/general-data-overview.component";
import {RepositoriesComponent} from "./general-data-overview/repositories/repositories.component";
import {TeamsComponent} from "./general-data-overview/teams/teams.component";
import {CloudSubscriptionsComponent} from "./general-data-overview/cloud-subscriptions/cloud-subscriptions.component";
import {
    BulkRepositoryImportModalComponent
} from "./administrative-actions/bulk-repository-import-modal/bulk-repository-import-modal.component";
import {ReactiveFormsModule} from "@angular/forms";
import {
    RepositoryListModalComponent
} from "./administrative-actions/repository-list-modal/repository-list-modal.component";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {
    SingleRepositoryImportModalComponent
} from "./administrative-actions/single-repository-import-modal/single-repository-import-modal.component";
import {AddNewTeamModalComponent} from "./administrative-actions/add-new-team-modal/add-new-team-modal.component";
import {
    RepositoriesTableLegendComponent
} from "./general-data-overview/repositories/repositories-table/repositories-table-legend/repositories-table-legend.component";
import {
    RepositoriesTableComponent
} from "./general-data-overview/repositories/repositories-table/repositories-table.component";
import {
    CloudSubscriptionsTableComponent
} from "./general-data-overview/cloud-subscriptions/cloud-subscriptions-table/cloud-subscriptions-table.component";
import {TeamsTableComponent} from "./general-data-overview/teams/teams-table/teams-table.component";
import {HasRoleDirective} from "../../directives/hasRole/has-role.directive";
import {
    RepositoryProvidersComponent
} from "./general-data-overview/repository-providers/repository-providers.component";
import {
    ConnectProviderModalComponent
} from "./administrative-actions/connect-provider-modal/connect-provider-modal.component";
import {ChangeTeamModalComponent} from "./administrative-actions/change-team-modal/change-team-modal.component";
import {
    RepositoryProvidersTableComponent
} from "./general-data-overview/repository-providers/repository-providers-table/repository-providers-table.component";

@NgModule({
  declarations: [
      InfoTileStaticComponent,
      SecurityOverviewComponent,
      AdministrativeActionsComponent,
      GeneralDataOverviewComponent,
      RepositoriesComponent,
      TeamsComponent,
      CloudSubscriptionsComponent,
      BulkRepositoryImportModalComponent,
      SingleRepositoryImportModalComponent,
      RepositoryListModalComponent,
      ConnectProviderModalComponent,
      AddNewTeamModalComponent,
      ChangeTeamModalComponent,
      RepositoriesTableLegendComponent,
      RepositoriesTableComponent,
      CloudSubscriptionsTableComponent,
      TeamsTableComponent,
      RepositoryProvidersComponent,
      RepositoryProvidersTableComponent
  ],
  exports: [
      SecurityOverviewComponent,
      AdministrativeActionsComponent,
      GeneralDataOverviewComponent
  ],
    imports: [
        CommonModule,
        IconDirective,
        RouterLink,
        ButtonDirective,
        CardBodyComponent,
        CardComponent,
        CardHeaderComponent,
        ChartjsComponent,
        ColComponent,
        RowComponent,
        SpinnerComponent,
        SharedModule,
        TooltipDirective,
        TabsComponent,
        TabsListComponent,
        TabDirective,
        TabPanelComponent,
        TabsContentComponent,
        FormControlDirective,
        FormDirective,
        FormSelectDirective,
        InputGroupComponent,
        InputGroupTextDirective,
        ModalBodyComponent,
        ModalComponent,
        ModalFooterComponent,
        ModalHeaderComponent,
        ModalTitleDirective,
        ReactiveFormsModule,
        NgxDatatableModule,
        HasRoleDirective,
    ]
})
export class DashboardModule { }
