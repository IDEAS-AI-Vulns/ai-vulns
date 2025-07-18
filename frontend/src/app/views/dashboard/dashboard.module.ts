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

@NgModule({
  declarations: [
      InfoTileStaticComponent,
      SecurityOverviewComponent,
      AdministrativeActionsComponent,
      GeneralDataOverviewComponent,
      RepositoriesComponent,
      TeamsComponent,
      CloudSubscriptionsComponent,
      BulkRepositoryImportModalComponent
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
        ReactiveFormsModule
    ]
})
export class DashboardModule { }
