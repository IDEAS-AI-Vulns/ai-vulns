import {Component, effect, inject, input, OnInit} from '@angular/core';
import {ToastService} from "../../../../../service/toast/toast.service";
import {TableColumn} from "../../repositories/repositories-table/table-column";
import {TeamService2} from "../../../../../service/team/team-service2.service";
import {Team} from "../../../../../model/Models";
import {Router} from "@angular/router";
import {ToastStatus} from "../../../../../shared/toast/toast-status";

@Component({
  selector: 'app-teams-table',
  templateUrl: './teams-table.component.html',
  styleUrl: './teams-table.component.scss'
})
export class TeamsTableComponent implements OnInit {

    readonly filter = input<string>();

    protected readonly teamService = inject(TeamService2);
    private readonly toastService = inject(ToastService);

    protected columns: TableColumn[] = [];
    protected visibleTeams: Team[] = [];

    constructor(private router: Router) {
        effect(() => {
            const value = this.filter();  // 👈 this will re-run whenever input changes
            this.filterTable(value);
        });
    }

    ngOnInit(): void {
        this.columns = [
            {prop: 'name', name: 'Name'},
            {prop: 'remoteIdentifier', name: 'Remote Identifier'},
            {prop: 'risk', name: 'Risk'}
        ];

        this.visibleTeams = this.teamService.teams();
    }

    protected showTeam(row: any) {
        this.router.navigate(['/show-team/' + row.id]).then(success => {
            if (!success) {
                this.toastService.show('Could not perform navigation', ToastStatus.Danger);
            }
        });
    }

    protected filterTable(value: any): void {
        const currentFilter = value.toLowerCase();

        // If there's no filter value, reset rows to full list
        if (!currentFilter) {
            this.visibleTeams = this.teamService.teams();
            return;
        }

        // Filter our data based on multiple columns
        this.visibleTeams = this.visibleTeams.filter(row => {
            // Ensure you filter based on all the relevant columns
            return (
                (row.name?.toLowerCase().includes(currentFilter) || '') ||
                (row.remoteIdentifier?.toLowerCase().includes(currentFilter) || '')
            );
        });
    }
}
