import {
    ChangeDetectorRef,
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
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../service/AuthService";
import {AppConfigService} from "../../service/AppConfigService";
import {DashboardModule} from "./dashboard.module";
import {SharedModule} from "../../shared/shared.module";
import {Team} from "../../model/Models";
import {TeamService} from "../../service/team/team-service.service";
import {CodeRepository} from "../../service/repositories/code-repository";
import {RepositoryService} from "../../service/repositories/repository.service";
import {CloudService} from "../../service/cloud/cloud.service";
import {CloudSubscription} from "./general-data-overview/cloud-subscriptions/cloud-subscription";
import {StatsService} from "../../service/stats/stats.service";
import {HasRoleDirective} from "../../directives/hasRole/has-role.directive";
import {getNavItems, navItems} from "../../layout/default-layout/_nav";

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
    private readonly teamsService = inject(TeamService);
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
        private appInfoService: AppConfigService,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) {
    }

    public mainChart: IChartProps = {type: 'line'};
    public mainChartRef: WritableSignal<any> = signal(undefined);

    public chart: Array<IChartProps> = [];

    ngOnInit(): void {
        const predefinedUser = this.route.snapshot.queryParamMap.get('user');
        if (predefinedUser !== null && predefinedUser !== undefined) {
            this.authService.login({
                password: 'demodemo',
                rememberMe: false,
                username: predefinedUser
            }).subscribe({
                next: (response) => {
                    // Get the payload from the token
                    const payloadBase64 = response.accessToken.split('.')[1];
                    const decodedPayload = atob(payloadBase64);
                    const payloadObject = JSON.parse(decodedPayload);

                    // Store user role
                    const userRole = payloadObject.roles;
                    localStorage.setItem('userRole', userRole);

                    navItems.length = 0;
                    navItems.push(...getNavItems());
                    this.cdr.detectChanges();

                    console.log('navItems', navItems);

                    this.handleUser();
                }
            });
        } else {
            this.handleUser();
        }


    }

    private handleUser(): void {
        let userRole = localStorage.getItem('userRole');
        this.authService.hc().subscribe({
            next: (response) => {
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

        this.repositoryService.fetchRepositories();
        this.teamsService.fetchTeams();
        this.cloudService.fetchCloudSubscriptions();
        this.statsService.fetchAggregatedStats();
        this.statsService.fetchDashboardMetrics();
        this.statsService.fetchVulnerabilitySummary();
        this.statsService.fetchVulnerabilityTrend();

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