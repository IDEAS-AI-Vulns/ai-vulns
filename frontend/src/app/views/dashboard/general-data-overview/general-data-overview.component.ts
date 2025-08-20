import {Component} from '@angular/core';

@Component({
  selector: 'app-general-data-overview',
  templateUrl: './general-data-overview.component.html',
  styleUrl: './general-data-overview.component.scss'
})
export class GeneralDataOverviewComponent {

  protected Tabs = Tabs;
}

enum Tabs {
  Repositories,
  Subscriptions,
  Teams,
  RepositoryProviders
}