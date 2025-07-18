import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FoldableContainerComponent} from "./foldable-container/foldable-container.component";
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent, InputGroupComponent, InputGroupTextDirective,
  RowComponent, SpinnerComponent
} from "@coreui/angular";
import {ChartjsComponent} from "@coreui/angular-chartjs";
import {IconDirective} from "@coreui/icons-angular";
import {SearchBarComponent} from "./search-bar/search-bar.component";

@NgModule({
  declarations: [
    FoldableContainerComponent,
    SearchBarComponent
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
    SpinnerComponent,
    InputGroupComponent,
    InputGroupTextDirective
  ],
  exports: [
      FoldableContainerComponent,
    SearchBarComponent
  ]
})
export class SharedModule { }
