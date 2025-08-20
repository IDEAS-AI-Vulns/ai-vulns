import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FoldableContainerComponent} from "./foldable-container/foldable-container.component";
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent, InputGroupComponent, InputGroupTextDirective,
  RowComponent, SpinnerComponent, ToastBodyComponent, ToastComponent, ToasterComponent, ToastHeaderComponent
} from "@coreui/angular";
import {ChartjsComponent} from "@coreui/angular-chartjs";
import {IconDirective} from "@coreui/icons-angular";
import {SearchBarComponent} from "./search-bar/search-bar.component";
import {ToastApplicationComponent} from "./toast/toast-application.component";
import {LoadingComponent} from "./loading/loading.component";

@NgModule({
  declarations: [
    FoldableContainerComponent,
    SearchBarComponent,
    ToastApplicationComponent,
    LoadingComponent
  ],
  imports: [
    CommonModule,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ChartjsComponent,
    ColComponent,
    IconDirective,
    RowComponent,
    InputGroupComponent,
    InputGroupTextDirective,
    ToasterComponent,
    ToastHeaderComponent,
    ToastBodyComponent,
    ToastComponent,
    SpinnerComponent,
  ],
  exports: [
      FoldableContainerComponent,
    ToastApplicationComponent,
    SearchBarComponent,
    LoadingComponent
  ]
})
export class SharedModule { }
