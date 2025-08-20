import {Component, effect, inject, input, OnInit} from '@angular/core';
import {TableColumn} from "../../repositories/repositories-table/table-column";
import {CloudSubscription} from "../cloud-subscription";
import {Router} from "@angular/router";
import {ToastService} from "../../../../../service/toast/toast.service";
import {CloudService} from "../../../../../service/cloud/cloud.service";
import {ToastStatus} from "../../../../../shared/toast/toast-status";

@Component({
  selector: 'app-cloud-subscriptions-table',
  templateUrl: './cloud-subscriptions-table.component.html',
  styleUrl: './cloud-subscriptions-table.component.scss'
})
export class CloudSubscriptionsTableComponent implements OnInit {

    readonly filter = input<string>();

    protected readonly cloudService = inject(CloudService);
    private readonly toastService = inject(ToastService);

    protected columns: TableColumn[] = [];
    protected visibleSubscriptions: CloudSubscription[] = [];

    constructor(private router: Router) {
        effect(() => {
            const value = this.filter();  // 👈 this will re-run whenever input changes
            this.filterTable(value);
        });
    }

    ngOnInit(): void {
        this.columns = [
            {prop: 'cloudSubscription', name: 'Cloud Subscription'},
            {prop: 'team', name: 'Team'},
            {prop: 'externalProjectName', name: 'External Project Name'},
            {prop: 'risk', name: 'Risk'}
        ];

        this.visibleSubscriptions = this.cloudService.subscriptions();
    }

    protected showSubscription(row: any) {
        this.router.navigate(['/show-cloud-subscription/' + row.id]).then(success => {
            if (!success) {
                this.toastService.show('Could not perform navigation', ToastStatus.Danger);
            }
        });
    }

    protected filterTable(value: any): void {
        const currentFilter = value.toLowerCase();

        // If there's no filter value, reset rows to full list
        if (!currentFilter) {
            this.visibleSubscriptions = this.cloudService.subscriptions();
            return;
        }

        // Filter our data based on multiple columns
        this.visibleSubscriptions = this.visibleSubscriptions.filter(row => {
            // Ensure you filter based on all the relevant columns
            return (
                (row.name?.toLowerCase().includes(currentFilter) || '') ||
                (row.team?.toLowerCase().includes(currentFilter) || '') ||
                (row.externalProjectName?.toLowerCase().includes(currentFilter) || '')
            );
        });
    }
}
