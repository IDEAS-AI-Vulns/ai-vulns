import {
    Component,
    DestroyRef,
    EventEmitter,
    inject,
    OnInit,
    Output,
    Renderer2,
    signal,
    WritableSignal
} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {ChartOptions} from 'chart.js';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {ColComponent,} from '@coreui/angular';
import {WidgetsDropdownComponent} from '../widgets/widgets-dropdown/widgets-dropdown.component';
import {DashboardChartsData, IChartProps} from './dashboard-charts-data';
import {DOCUMENT} from "@angular/common";
import {Router} from "@angular/router";
import {AuthService} from "../../service/AuthService";
import {TeamService} from "../../service/TeamService";
import {AppConfigService} from "../../service/AppConfigService";
import {DashboardModule} from "./dashboard.module";
import {SharedModule} from "../../shared/shared.module";
import {Team} from "../../model/Models";
import {TeamService2} from "../../service/team/team-service2.service";
import {CodeRepository} from "../../service/repositories/code-repository";
import {RepositoryService} from "../../service/repositories/repository.service";
import {CloudService} from "../../service/cloud/cloud.service";
import {CloudSubscription} from "./general-data-overview/cloud-subscriptions/cloud-subscription";
import {StatsService} from "../../service/stats/stats.service";
import {HasRoleDirective} from "../../directives/hasRole/has-role.directive";

@Component({
    templateUrl: 'dashboard.component.html',
    styleUrls: ['dashboard.component.scss'],
    standalone: true,
    imports: [
        WidgetsDropdownComponent,
        ColComponent, ReactiveFormsModule,
        NgxDatatableModule, DashboardModule, SharedModule, HasRoleDirective
    ]
})
export class DashboardComponent implements OnInit {

    protected isSecurityOverviewVisible: boolean = true;

    //TODO: correct the name
    private readonly teamsService = inject(TeamService2);
    private readonly repositoryService = inject(RepositoryService);
    private readonly cloudService = inject(CloudService);
    protected readonly statsService = inject(StatsService);

    protected repositories: CodeRepository[] = this.repositoryService.repositories();

    protected securityOverviewToggled($event: boolean) {
        this.isSecurityOverviewVisible = $event;
    }

    teams: Team[] = [];

    canManage: boolean = false;

    @Output() userRoleSet: EventEmitter<string> = new EventEmitter<string>();

    appInfo: any;


    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #document: Document = inject(DOCUMENT);
    readonly #renderer: Renderer2 = inject(Renderer2);
    readonly #chartsData: DashboardChartsData = inject(DashboardChartsData);


    constructor(
        private router: Router,
        private authService: AuthService,
        private teamService: TeamService,
        private appInfoService: AppConfigService
    ) {
    }

    public mainChart: IChartProps = {type: 'line'};
    public mainChartRef: WritableSignal<any> = signal(undefined);

    public chart: Array<IChartProps> = [];

    ngOnInit(): void {
        console.log('ngOnInit() of DashboardComponent');
        let userRole = localStorage.getItem('userRole');

        this.authService.hc().subscribe({
            next: (response) => {
                console.log('userRole', response);
                if (!userRole) {
                    localStorage.setItem('userRole', response.status.replace("ROLE_", ""));
                    location.reload();
                }
                this.canManage = true;
            },
            error: () => {
                // Health check failed, redirect to login
                this.router.navigate(['/login']);
            }
        });

        this.teamsService.fetchTeams();
        this.repositoryService.fetchRepositories();
        this.cloudService.fetchCloudSubscriptions();
        this.statsService.fetchAggregatedStats();
        this.statsService.fetchDashboardMetrics();
        this.statsService.fetchVulnerabilitySummary();
        this.statsService.fetchVulnerabilityTrend();

        this.loadTeams();
        this.initCharts();
        this.updateChartOnColorModeChange();
        this.loadAppInfo();
    }


    loadAppInfo(): void {
        this.appInfoService.getAppModeInfo().subscribe({
            next: (data) => {
                this.appInfo = data;
            },
            error: (err) => {
                console.error('Failed to load app info:', err);
            }
        });
    }

    loadTeams() {
        this.teamService.get().subscribe({
            next: (response: Team[]) => {
                /*this.teams = response.map((team: Team) => {
                    const teamRepos = this.repositories.filter((repo: CodeRepository) => repo.team.toLowerCase() === team.name.toLowerCase());
                    const {sast, sca, iac, secrets, dast :string, gitlab} = this.getRepoScanStatus(teamRepos);

                    const teamCloudSubscriptions = this.cloudRows.filter((cloudSubscription: CloudSubscription) => cloudSubscription.team.toLowerCase() === team.name.toLowerCase());
                    const { cloudScan } = this.getCloudScanStatus(teamCloudSubscriptions);

                    return {...team, sastStatus: sast, scaStatus: sca, iacStatus: iac, secretsStatus: secrets, gitlabStatus:gitlab, cloudScanStatus: cloudScan};
                });
                this.teamsTemp = [...this.teams];*/
            },
            error: (error: any) => {
                console.error('Error loading teams:', error);
            }
        });
    }

    getRepoScanStatus(repos: CodeRepository[]): { sast: string, sca: string, iac: string, secrets: string, dast: string, gitlab:string } {
        const getStatus = (scanType: 'sast' | 'iac' | 'secrets' | 'sca' | 'dast' | 'gitlab'): string => {
            const statuses = repos.map(repo => repo[scanType]);
            if (statuses.includes('DANGER')) {
                return 'DANGER';
            } else if (statuses.includes('WARNING')) {
                return 'WARNING';
            } else if (statuses.every(status => status === 'NOT_PERFORMED')) {
                return 'NOT_PERFORMED';
            } else if (statuses.includes('SUCCESS')) {
                return 'SUCCESS';
            }
            return 'UNKNOWN'; // Default return value for unexpected cases
        };

        return {
            sast: getStatus('sast'),
            sca: getStatus('sca'),
            iac: getStatus('iac'),
            secrets: getStatus('secrets'),
            dast: getStatus('dast'),
            gitlab: getStatus('gitlab')
        };
    }

    getCloudScanStatus(cloudSubscriptions: CloudSubscription[]): { cloudScan: string } {
        const statuses = cloudSubscriptions.map(subscription => subscription.scanStatus);

        if (statuses.includes('DANGER')) {
            return { cloudScan: 'DANGER' };
        } else if (statuses.includes('WARNING')) {
            return { cloudScan: 'WARNING' };
        } else if (statuses.every(status => status === 'NOT_PERFORMED')) {
            return { cloudScan: 'NOT_PERFORMED' };
        } else if (statuses.includes('SUCCESS')) {
            return { cloudScan: 'SUCCESS' };
        }

        return { cloudScan: 'UNKNOWN' };
    }

    initCharts(): void {
        this.mainChart = this.#chartsData.mainChart;
    }

    updateChartOnColorModeChange() {
        const unListen = this.#renderer.listen(this.#document.documentElement, 'ColorSchemeChange', () => {
            this.setChartStyles();
        });

        this.#destroyRef.onDestroy(() => {
            unListen();
        });
    }

    setChartStyles() {
        if (this.mainChartRef()) {
            setTimeout(() => {
                const options: ChartOptions = {...this.mainChart.options};
                const scales = this.#chartsData.getScales();
                this.mainChartRef().options.scales = {...options.scales, ...scales};
                this.mainChartRef().update();
            });
        }
    }
}