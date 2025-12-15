import {AfterViewInit, ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation,} from '@angular/core';
import {MarkdownModule, provideMarkdown,} from 'ngx-markdown';
import {
    AccordionButtonDirective,
    AccordionComponent,
    AccordionItemComponent,
    AlertComponent,
    BadgeComponent,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    FormLabelDirective,
    ListGroupDirective,
    ListGroupItemDirective,
    ModalModule,
    ProgressComponent,
    RowComponent,
    SpinnerComponent,
    TabDirective,
    TabPanelComponent,
    TabsComponent,
    TabsContentComponent,
    TabsListComponent,
    TemplateIdDirective,
    ToastBodyComponent,
    ToastComponent,
    ToasterComponent,
    ToastHeaderComponent,
    TooltipDirective,
} from '@coreui/angular';
import {IconDirective, IconSetService} from '@coreui/icons-angular';
import {
    brandSet,
    cilArrowRight,
    cilBug,
    cilBurn,
    cilCenterFocus,
    cilChartPie,
    cilCommentSquare,
    cilGraph,
    cilMagnifyingGlass,
    cilTrash,
    cilVolumeOff,
    freeSet,
} from '@coreui/icons';
import {ChartjsComponent} from '@coreui/angular-chartjs';
import {ChartData} from 'chart.js/dist/types';
import {ChartOptions} from 'chart.js';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {RepoService} from '../../service/RepoService';
import {AuthService} from '../../service/AuthService';
import {ActivatedRoute, Router} from '@angular/router';
import {FindingSourceStatDTO} from '../../model/FindingSourceStatDTO';
import {FindingDTO, SingleFindingDTO} from '../../model/FindingDTO';
import {FormsModule} from '@angular/forms';
import {TeamService} from "../../service/TeamService";
import {RepositoryInfoComponent} from "./repository-info/repository-info.component";
import {VulnerabilitiesTableComponent} from "./vulnerabilities-table/vulnerabilities-table.component";
import {VulnerabilityDetailsComponent} from "./vulnerability-details/vulnerability-details.component";
import {ExploitService} from "../../service/exploit/exploit.service";
import {ToastApplicationComponent} from "../../shared/toast/toast-application.component";
import {ToastService} from "../../shared/toast/service/toast.service";
import {ToastStatus} from "../../shared/toast/toast-status";
import {ExploitFunnelComponent} from "./exploit-funnel/exploit-funnel.component";
import {SharedModule} from "../../shared/shared.module";
import {Vulnerability} from "../../model/Vulnerability";
import {AppDataType} from "../../model/AppDataType";
import {GroupedAppDataType} from "../../model/GroupedAppDataType";
import {CodeRepoFindingStats} from "../../model/CodeRepoFindingStats";
import {Team} from "../../model/Team";

@Component({
    selector: 'app-show-repo',
    standalone: true,
    imports: [
        RowComponent,
        ColComponent,
        CardComponent,
        ButtonDirective,
        IconDirective,
        ProgressComponent,
        CardBodyComponent,
        ChartjsComponent,
        CardHeaderComponent,
        TemplateIdDirective,
        TabsListComponent,
        TabsContentComponent,
        TabPanelComponent,
        TabsComponent,
        TabDirective,
        NgxDatatableModule,
        BadgeComponent,
        NgIf,
        AlertComponent,
        SpinnerComponent,
        FormLabelDirective,
        ModalModule,
        DatePipe,
        NgForOf,
        FormsModule,
        ToastBodyComponent,
        ToastComponent,
        ToastHeaderComponent,
        ToasterComponent,
        AccordionItemComponent,
        AccordionButtonDirective,
        AccordionComponent,
        ListGroupDirective,
        ListGroupItemDirective,
        TooltipDirective,
        MarkdownModule,
        RepositoryInfoComponent,
        VulnerabilitiesTableComponent,
        VulnerabilityDetailsComponent,
        ToastApplicationComponent,
        ExploitFunnelComponent,
        SharedModule,

    ],
    templateUrl: './show-repo.component.html',
    styleUrls: ['./show-repo.component.scss'],
    providers: [DatePipe, provideMarkdown()],
    encapsulation: ViewEncapsulation.None
})
export class ShowRepoComponent implements OnInit, AfterViewInit {
    repoData: any;
    repoId: string = '';
    findings: FindingDTO | undefined;
    icons = {
        cilChartPie,
        cilArrowRight,
        cilBug,
        cilCenterFocus,
        cilCommentSquare,
        cilBurn,
        cilGraph,
        cilTrash,
        cilVolumeOff,
        cilMagnifyingGlass,
    };
    sourceStats: FindingSourceStatDTO = new FindingSourceStatDTO();
    topLanguages: { name: string; value: number; color: string }[] = [];
    chartPieData: ChartData | undefined;
    singleVuln: SingleFindingDTO | undefined;
    suppressReason: string = '';
    suppressReasons: string[] = ['WONT_FIX', 'FALSE_POSITIVE', 'ACCEPTED'];
    counts: any;
    grouppedDataTypes: any;
    isAccordionVisible: boolean[] = [];
    codeRepoFindingStats: CodeRepoFindingStats[] = [];
    filtersNew: { [key: string]: string } = {
        group: '',
        name: '',
        version: '',
    };
    scanRunning: boolean = false;
    userRole: string = 'USER';

    filteredComponents: any[] = [];
    scanInfos: any[] = [];
    scanInfosFiltered: any[] = [];

    options = {
        maintainAspectRatio: false,
    };
    months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    public options2: ChartOptions = {
        responsive: true,
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
            },
        },
    };

    chartLineData: ChartData = {
        labels: [],
        datasets: [
            {
                label: 'SAST',
                backgroundColor: 'rgba(220, 220, 220, 0.2)',
                borderColor: 'rgba(220, 220, 220, 1)',
                pointBackgroundColor: 'rgba(220, 220, 220, 1)',
                pointBorderColor: '#fff',
                data: [],
            },
            {
                label: 'IaC',
                backgroundColor: 'rgba(151, 187, 205, 0.2)',
                borderColor: 'rgb(71, 180, 234)',
                pointBackgroundColor: 'rgb(71, 163, 211)',
                pointBorderColor: '#bd7777',
                data: [],
            },
            {
                label: 'Secrets',
                backgroundColor: 'rgba(151, 187, 205, 0.2)',
                borderColor: 'rgb(28, 197, 45)',
                pointBackgroundColor: 'rgb(102, 190, 107)',
                pointBorderColor: '#bd7777',
                data: [],
            },
            {
                label: 'SCA',
                backgroundColor: 'rgba(151, 187, 205, 0.2)',
                borderColor: 'rgb(210, 124, 56)',
                pointBackgroundColor: 'rgb(128, 101, 56)',
                pointBorderColor: '#bd7777',
                data: [],
            },
            {
                label: 'DAST',
                backgroundColor: 'rgba(255, 159, 64, 0.2)', // Example color, adjust as needed
                borderColor: 'rgb(255, 159, 64)',
                pointBackgroundColor: 'rgb(255, 159, 64)',
                pointBorderColor: '#fff',
                data: [],
            },
        ],
    };

    vulns: Vulnerability[] = [];
    filteredVulns = [...this.vulns]; // a copy of the original rows for filtering

    filters: { [key: string]: string } = {
        actions: '',
        name: '',
        location: '',
        source: '',
        status: '',
        severity: '',
        exploitabilityStart: '',
        exploitabilityEnd: '',
        dates: '',
    };
    // Tracks the current Status dropdown value (used by template bindings & toggle disable logic)
    statusFilter: string = '';

    showRemoved: boolean = false;
    showSuppressed: boolean = false;
    showUrgent: boolean = false;
    showNotable: boolean = false;
    hasUrgentFindings: boolean = false;
    hasNotableFindings: boolean = false;

    detailsModal: boolean = false;
    selectedRowId: number | null = null;

    bulkActionMode: boolean = false;
    selectedFindings: number[] = [];

    // New properties for loading indicators and limits
    vulnerabilitiesLoading: boolean = false;
    vulnerabilitiesLimit: number = 15;

    scanInfoLoading: boolean = false;
    scanInfoLimit: number = 15;

    componentsLimit: number = 10;

    // Search filter for Scan Info
    scanInfoFilter: string = '';

    // New properties for team change functionality
    changeTeamModalVisible: boolean = false;
    confirmationModalVisible: boolean = false;
    confirmationText: string = '';
    availableTeams: Team[] = [];
    selectedNewTeamId: number | null = null;

    // Comment properties
    newComment: string = '';
    isAddingComment: boolean = false;

    // Selected branch
    selectedBranch: string | null = null;

    exploitService: ExploitService = inject(ExploitService);
    toastService: ToastService = inject(ToastService);

    // Snapshot for filter/toggle UI state when modal is open
    private filterUiSnapshot: {
        filters: { [key: string]: string };
        showRemoved: boolean;
        showSuppressed: boolean;
        showUrgent: boolean;
        showNotable: boolean;
        statusFilter: string;
    } | null = null;

    constructor(
        public iconSet: IconSetService,
        private repoService: RepoService,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private datePipe: DatePipe,
        private teamService: TeamService
    ) {
        iconSet.icons = { ...brandSet, ...freeSet };

    }

    ngAfterViewInit() {
        //this.cdr.detectChanges();
    }

    ngOnInit(): void {
        // @ts-ignore
        this.userRole = localStorage.getItem('userRole');
        this.cdr.detectChanges();

        this.route.paramMap.subscribe((params) => {
            this.repoId = params.get('id') || '';
        });
        this.authService.hc().subscribe({
            next: () => {
                // Health check passed, proceed with loading the dashboard
            },
            error: () => {
                this.router.navigate(['/login']);
            },
        });
        this.loadRepoInfo();
        this.loadSourceStats();
        this.loadFindings();
        this.loadFindingStats();
        this.applyFilters();

        // Enhanced chart options
        this.options2 = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: 10,
                    bodyFont: {
                        size: 12
                    },
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    }
                }
            }
        };
    }

    loadRepoInfo() {
        this.scanInfoLoading = true;
        this.repoService.getRepo(+this.repoId).subscribe({
            next: (response) => {
                this.repoData = response;
                this.grouppedDataTypes = this.groupAppDataTypesByCategory(
                    this.repoData.appDataTypes
                );
                this.topLanguages = this.getTopLanguages(this.repoData.languages);
                this.filteredComponents = [...this.repoData?.components];
                this.scanInfos = response.scanInfos;
                this.applyScanInfoFilter(); // Apply filter after data is loaded
                this.scanInfoLoading = false;
                if (
                    response.sastScan === 'RUNNING' ||
                    response.scaScan === 'RUNNING' ||
                    response.secretsScan === 'RUNNING' ||
                    response.iacScan === 'RUNNING' ||
                    response.dastScan === 'RUNNING' ||
                    response.exploitabilityScan === 'RUNNING'
                ) {
                    this.scanRunning = true;
                }
            },
            error: () => {
                this.scanInfoLoading = false;
            },
        });
    }

    loadFindings() {
        this.vulnerabilitiesLoading = true;
        this.repoService.getFindingsDefBranch(+this.repoId).subscribe({
            next: (response) => {
                this.vulns = response.map((v: any, i: number) => ({ ...v, __idx: i }));
                this.filteredVulns = [...this.vulns];
                this.counts = this.countFindings(this.vulns);
                this.checkForSpecialFindings();
                // Restore filter state from storage before applying filters
                this.restoreFilterStateFromStorage();
                this.applyFilters();
                this.vulnerabilitiesLoading = false;
            },
            error: () => {
                this.vulnerabilitiesLoading = false;
            },
        });
        this.applyFilters();
    }
    loadFindingStats() {
        this.repoService.getFindingStats(+this.repoId).subscribe({
            next: (response) => {
                this.codeRepoFindingStats = response.sort(
                    (a: CodeRepoFindingStats, b: CodeRepoFindingStats) =>
                        new Date(a.dateInserted).getTime() -
                        new Date(b.dateInserted).getTime()
                );
                this.prepareChartData();
            },
        });
    }
    loadSourceStats() {
        this.repoService.getSourceStats(+this.repoId).subscribe({
            next: (response) => {
                this.sourceStats = response;
                this.buildChartData(response);
            },
        });
    }

    private buildChartData(response: any) {
        let stats : FindingSourceStatDTO;
        stats = this.sourceStats;

        if(Array.isArray(response)) {
            stats.sast = 0;
            stats.sca = 0;
            stats.secrets = 0;
            stats.iac = 0;
            stats.dast = 0;
            stats.gitlab = 0;
            response.forEach(v => {
                const source = v.source?.trim().toLowerCase();
                switch (source) {
                    case 'sast': stats.sast++; break;
                    case 'sca': stats.sca++; break;
                    case 'secrets': stats.secrets++; break;
                    case 'iac': stats.iac++; break;
                    case 'dast': stats.dast++; break;
                    case 'gitlab': stats.gitlab++; break;
                }
            });
        }
        let labels: string[] = [];
        let data: number[] = [];
        let backgroundColor: string[] = [];
        let hoverBackgroundColor: string[] = [];

        if (stats.sast > 0) {
            labels.push('SAST');
            data.push(stats.sast);
            backgroundColor.push('#FF6384');
            hoverBackgroundColor.push('#FF6384');
        }

        if (stats.sca > 0) {
            labels.push('SCA');
            data.push(stats.sca);
            backgroundColor.push('#36A2EB');
            hoverBackgroundColor.push('#36A2EB');
        }

        if (stats.secrets > 0) {
            labels.push('Secrets');
            data.push(stats.secrets);
            backgroundColor.push('#449a77');
            hoverBackgroundColor.push('#449a77');
        }

        if (stats.iac > 0) {
            labels.push('IaC');
            data.push(stats.iac);
            backgroundColor.push('#FFCE12');
            hoverBackgroundColor.push('#FFCE12');
        }

        if (stats.dast > 0) {
            labels.push('DAST');
            data.push(stats.dast);
            backgroundColor.push('#FF8929D8');
            hoverBackgroundColor.push('#FF8929D8');
        }

        if (stats.gitlab > 0) {
            labels.push('GitLab');
            data.push(stats.gitlab);
            backgroundColor.push('#EA29FFD8');
            hoverBackgroundColor.push('#EA29FFD8');
        }

        this.chartPieData = {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: backgroundColor,
                    hoverBackgroundColor: hoverBackgroundColor,
                },
            ],
        };
    }

    //TODO: remove this
    protected exploitability: number = 0;
    viewVulnerabilityDetails(row: Vulnerability) {
        // Snapshot current filters/toggles so we can restore them after closing the modal
        console.log(row);
        this.filterUiSnapshot = {
            filters: { ...this.filters },
            showRemoved: this.showRemoved,
            showSuppressed: this.showSuppressed,
            showUrgent: this.showUrgent,
            showNotable: this.showNotable,
            statusFilter: this.statusFilter,
        };

        this.selectedRowId = row.id;
        // @ts-ignore
        this.exploitability = row.predictedProbability;
        this.detailsModal = true;
        this.repoService.getFinding(+this.repoId, this.selectedRowId).subscribe({
            next: (response) => {
                this.singleVuln = response;
                this.cdr.markForCheck();
            },
        });
    }

    updateFilterName(event: any) {
        this.filters['name'] = event.target.value.toLowerCase();
        this.saveFilterStateToStorage();
        this.applyFilters();
    }
    updateFilterLocation(event: any) {
        this.filters['location'] = event.target.value.toLowerCase();
        this.saveFilterStateToStorage();
        this.applyFilters();
    }
    updateFilterSource(event: any) {
        this.filters['source'] = event.target.value;
        this.saveFilterStateToStorage();
        this.applyFilters();
    }
    updateFilterStatus(event: any)
    {
        const val = (event?.target?.value ?? '').toString();
        this.filters['status'] = val;
        this.statusFilter = val; // keep in sync for template bindings [disabled]

        // Auto-enable/disable toggles based on selected status
        if (val === 'REMOVED') {
            if (!this.showRemoved) this.showRemoved = true;
            // do not force suppressed off/on here
        } else if (val === 'SUPRESSED') { // note: matches the spelling used in data
            if (!this.showSuppressed) this.showSuppressed = true;
        } else if (val === 'NEW' || val === 'EXISTING' || val === '') {
            // Focus on active items — hide Removed/Suppressed
            if (this.showRemoved) this.showRemoved = false;
            if (this.showSuppressed) this.showSuppressed = false;
        }
        this.saveFilterStateToStorage();
        this.applyFilters();
    }
    updateFilterSeverity(event: any) {
        this.filters['severity'] = event.target.value;
        this.saveFilterStateToStorage();
        this.applyFilters();
    }
    updateFilterExploitability(event: any) {
        this.filters['exploitabilityStart'] = event.target.value.value;
        this.filters['exploitabilityEnd'] = event.target.value.highValue;

        this.saveFilterStateToStorage();
        this.applyFilters();
    }

    toggleShowRemoved(event: any) {
        this.showRemoved = event.target.checked;
        this.saveFilterStateToStorage();
        this.applyFilters();
    }

    toggleShowSuppressed(event: any) {
        this.showSuppressed = event.target.checked;
        this.saveFilterStateToStorage();
        this.applyFilters();
    }

    toggleShowUrgent(event: any) {
        this.showUrgent = event.target.checked;
        if (this.showUrgent) {
            this.showNotable = false;
        }
        this.saveFilterStateToStorage();
        this.applyFilters();
    }

    toggleShowNotable(event: any) {
        this.showNotable = event.target.checked;
        if (this.showNotable) {
            this.showUrgent = false;
        }
        this.saveFilterStateToStorage();
        this.applyFilters();
    }

    checkForSpecialFindings(): void {
        this.hasUrgentFindings = this.vulns.some(v => v.urgency === 'urgent' && v.status !== 'REMOVED' && v.status !== 'SUPRESSED');
        this.hasNotableFindings = this.vulns.some(v => v.urgency === 'notable' && v.status !== 'REMOVED' && v.status !== 'SUPRESSED');
    }

    applyFilters() {
        this.filteredVulns = this.vulns.filter((vuln) => {
            // Standard text and select filters
            const matchesFilters = Object.keys(this.filters).every((key) => {
                const filterValue = this.filters[key];
                if (!filterValue) return true;

                const vulnValue = (vuln as any)[key];
                if (key !== 'exploitabilityStart' && key !== 'exploitabilityEnd') {
                    if (!vulnValue) return false;
                } else {
                    if (key === 'exploitabilityStart') {
                        // @ts-ignore
                        return vuln.predictedProbability * 100 >= filterValue;
                    } else {
                        // @ts-ignore
                        return vuln.predictedProbability * 100 <= filterValue;
                    }
                }

                if (key === 'source' || key === 'urgency' || key === 'status' || key === 'severity') {
                    return (
                        typeof vulnValue === 'string' &&
                        vulnValue.toLowerCase() === filterValue.toLowerCase()
                    );
                }
                // Removed stray sortByUrgencyThenOriginal call from filter predicate
                return vulnValue
                    .toString()
                    .toLowerCase()
                    .includes(filterValue.toLowerCase());
            });

            // Filter for Removed and Suppressed toggles
            const matchesStatus =
                (this.showRemoved || vuln.status !== 'REMOVED') &&
                (this.showSuppressed || vuln.status !== 'SUPRESSED');

            // Filter for Urgency and Notable toggles
            const matchesUrgency = () => {
                if (this.showUrgent) return vuln.urgency === 'urgent';
                if (this.showNotable) return vuln.urgency === 'notable';
                return true; // If no urgency filter is active, don't filter by it
            };
            return matchesFilters && matchesStatus && matchesUrgency();
        });
        this.buildChartData(this.filteredVulns);
        this.sortByUrgencyThenOriginal(this.filteredVulns);
        this.saveFilterStateToStorage();
    }

    handleDetailsModal(visible: boolean) {
        this.detailsModal = visible;
    }

    closeModal() {
        this.detailsModal = false;
        if (this.filterUiSnapshot) {
            this.filters = { ...this.filterUiSnapshot.filters };
            this.showRemoved = this.filterUiSnapshot.showRemoved;
            this.showSuppressed = this.filterUiSnapshot.showSuppressed;
            this.showUrgent = this.filterUiSnapshot.showUrgent;
            this.showNotable = this.filterUiSnapshot.showNotable;
            this.statusFilter = this.filterUiSnapshot.statusFilter;
            this.applyFilters();
            this.saveFilterStateToStorage();
            this.filterUiSnapshot = null;
        }
    }

    getTopLanguages(languages: { [name: string]: number }): {
        name: string;
        value: number;
        color: string;
    }[] {
        const colors = ['success', 'warning', 'primary', 'secondary', 'info'];

        return Object.entries(languages)
            .map(([name, value], index) => ({ name, value, color: colors[index] }))
            .sort((a, b) => b.value - a.value) // Sort by value descending
            .slice(0, 4); // Take the top 4 entries
    }

    // refreshData() {
    //     alert('clicked');
    // }
    suppressFinding() {
        // Restore UI state first so inputs remain populated
        this.closeModal();

        if (this.selectedRowId && this.suppressReason) {
            this.repoService
                .supressFinding(+this.repoId, this.selectedRowId, this.suppressReason)
                .subscribe({
                    next: () => {
                        this.toastStatus = 'success';
                        this.toastMessage = 'Successfully Suppressed finding';
                        this.toggleToast();
                        // Persist current filters before/after reload
                        this.saveFilterStateToStorage();
                        this.loadFindings();
                    },
                });
        }
    }

    position = 'top-end';
    visible = false;
    percentage = 0;
    toastMessage: string = '';
    toastStatus: string = '';

    toggleToast() {
        this.visible = !this.visible;
    }
    onVisibleChange($event: boolean) {
        this.visible = $event;
        this.percentage = !this.visible ? 0 : this.percentage;
    }

    reactivateFinding() {
        if (this.selectedRowId) {
            this.repoService
                .reActivateFinding(+this.repoId, this.selectedRowId)
                .subscribe({
                    next: (response) => {
                        this.toastStatus = 'success';
                        this.toastMessage = 'Successfully Re-Activated finding';
                        this.toggleToast();
                        this.loadFindings();
                    },
                });
        }
        this.closeModal();
    }

    onBranchSelect(event: any) {
        const selectedBranchId = event.target.value;
        this.repoService.getFindingsBranch(+this.repoId, selectedBranchId).subscribe({
            next: (response) => {
                this.vulns = response.map((v: any, i: number) => ({ ...v, __idx: i }));
                this.filteredVulns = [...this.vulns];
                this.counts = this.countFindings(this.vulns);
                this.checkForSpecialFindings();
                this.applyFilters();
                this.toastStatus = 'success';
                this.toastMessage = 'Successfully switched to another branch';
                this.toggleToast();
            },
        });
        // Call a method to handle the selected branch ID
    }

    private sortByUrgencyThenOriginal(rows: any[]): any[] {
        const prio = (u?: string) => (u === 'urgent' ? 0 : u === 'notable' ? 1 : 2);
        return rows.sort((a, b) => {
            const pa = prio(a.urgency);
            const pb = prio(b.urgency);
            if (pa !== pb) return pa - pb;
            const ia = typeof a.__idx === 'number' ? a.__idx : 0;
            const ib = typeof b.__idx === 'number' ? b.__idx : 0;
            return ia - ib;
        });
    }

    countFindings(vulnerabilities: Vulnerability[]) {
        const counts = {
            critical: 0,
            high: 0,
            rest: 0,
            urgent: 0,
            notable: 0,
        };

        vulnerabilities.forEach((vuln) => {
            if (vuln.status === 'EXISTING' || vuln.status === 'NEW') {
                // Severity counts
                if (vuln.severity === 'CRITICAL') {
                    counts.critical++;
                } else if (vuln.severity === 'HIGH') {
                    counts.high++;
                } else {
                    counts.rest++;
                }

                // Urgency counts
                if (vuln.urgency === 'urgent') {
                    counts.urgent++;
                } else if (vuln.urgency === 'notable') {
                    counts.notable++;
                }
            }
        });

        return counts;
    }

    groupAppDataTypesByCategory(appDataTypes: AppDataType[]): GroupedAppDataType[] {
        const categoryGroupMap: { [key: string]: AppDataType[] } = {};

        appDataTypes.forEach((appDataType) => {
            appDataType.categoryGroups.forEach((categoryGroup) => {
                if (!categoryGroupMap[categoryGroup]) {
                    categoryGroupMap[categoryGroup] = [];
                }

                // Check if appDataType already exists in the category group based on a unique property
                const isDuplicate = categoryGroupMap[categoryGroup].some(
                    (existingAppDataType) =>
                        existingAppDataType.id === appDataType.id ||
                        existingAppDataType.name === appDataType.name
                );

                if (!isDuplicate) {
                    categoryGroupMap[categoryGroup].push(appDataType);
                }
            });
        });

        return Object.keys(categoryGroupMap).map((categoryGroup) => ({
            categoryGroup,
            appDataTypes: categoryGroupMap[categoryGroup],
        }));
    }

    toggleAccordion(index: number): void {
        this.isAccordionVisible[index] = !this.isAccordionVisible[index];
    }

    getKeys(obj: any): string[] {
        return Object.keys(obj);
    }
    prepareChartData() {
        const labels = this.codeRepoFindingStats.map((stat) =>
            this.datePipe.transform(stat.dateInserted, 'dd MMM')
        );
        const sastData = this.codeRepoFindingStats.map(
            (stat) => stat.sastCritical + stat.sastHigh + stat.sastMedium + stat.sastRest
        );
        const dastData = this.codeRepoFindingStats.map(
            (stat) => stat.dastCritical + stat.dastHigh + stat.dastMedium + stat.dastRest
        );
        const iacData = this.codeRepoFindingStats.map(
            (stat) => stat.iacCritical + stat.iacHigh + stat.iacMedium + stat.iacRest
        );
        const secretsData = this.codeRepoFindingStats.map(
            (stat) =>
                stat.secretsCritical + stat.secretsHigh + stat.secretsMedium + stat.secretsRest
        );
        const scaData = this.codeRepoFindingStats.map(
            (stat) => stat.scaCritical + stat.scaHigh + stat.scaMedium + stat.scaRest
        );
        const gitlabData = this.codeRepoFindingStats.map(
            (stat) => stat.gitlabCritical + stat.gitlabHigh + stat.gitlabMedium + stat.gitlabRest
        );

        this.chartLineData = {
            labels: labels,
            datasets: [
                {
                    label: 'SAST',
                    backgroundColor: 'rgba(220, 220, 220, 0.2)',
                    borderColor: 'rgba(220, 220, 220, 1)',
                    pointBackgroundColor: 'rgba(220, 220, 220, 1)',
                    pointBorderColor: '#fff',
                    data: sastData,
                },
                {
                    label: 'IaC',
                    backgroundColor: 'rgba(151, 187, 205, 0.2)',
                    borderColor: 'rgb(71, 180, 234)',
                    pointBackgroundColor: 'rgb(71, 163, 211)',
                    pointBorderColor: '#bd7777',
                    data: iacData,
                },
                {
                    label: 'Secrets',
                    backgroundColor: 'rgba(151, 187, 205, 0.2)',
                    borderColor: 'rgb(28, 197, 45)',
                    pointBackgroundColor: 'rgb(102, 190, 107)',
                    pointBorderColor: '#bd7777',
                    data: secretsData,
                },
                {
                    label: 'SCA',
                    backgroundColor: 'rgba(151, 187, 205, 0.2)',
                    borderColor: 'rgb(210, 124, 56)',
                    pointBackgroundColor: 'rgb(128, 101, 56)',
                    pointBorderColor: '#bd7777',
                    data: scaData,
                },
                {
                    label: 'GitLab',
                    backgroundColor: 'rgba(255, 165, 0, 0.2)',
                    borderColor: 'rgb(255, 140, 0)',
                    pointBackgroundColor: 'rgb(255, 165, 0)',
                    pointBorderColor: '#ffa500',
                    data: gitlabData,
                },
            ],
        };
    }
    getLastOpenedFindings(): number {
        return this.codeRepoFindingStats.length > 0
            ? this.codeRepoFindingStats[this.codeRepoFindingStats.length - 1].openedFindings
            : 0;
    }
    getLastRemovedFinding(): number {
        return this.codeRepoFindingStats.length > 0
            ? this.codeRepoFindingStats[this.codeRepoFindingStats.length - 1].removedFindings
            : 0;
    }
    getLastFixTime(): number {
        return this.codeRepoFindingStats.length > 0
            ? this.codeRepoFindingStats[this.codeRepoFindingStats.length - 1].averageFixTime
            : 0;
    }
    getLastRevievedFinding(): number {
        return this.codeRepoFindingStats.length > 0
            ? this.codeRepoFindingStats[this.codeRepoFindingStats.length - 1].reviewedFindings
            : 0;
    }

    updateFilterGroup(event: any) {
        const val = event.target.value.toLowerCase();
        this.filtersNew['group'] = val;
        this.applyFiltersNew();
    }

    updateFilterNameNew(event: any) {
        const val = event.target.value.toLowerCase();
        this.filtersNew['name'] = val;
        this.applyFiltersNew();
    }

    updateFilterVersion(event: any) {
        const val = event.target.value.toLowerCase();
        this.filtersNew['version'] = val;
        this.applyFiltersNew();
    }

    applyFiltersNew() {
        this.filteredComponents = this.repoData?.components.filter(
            (component: { groupid: string; name: string; version: string }) => {
                return (
                    (!this.filtersNew['group'] ||
                        component.groupid?.toLowerCase().includes(this.filtersNew['group'])) &&
                    (!this.filtersNew['name'] ||
                        component.name?.toLowerCase().includes(this.filtersNew['name'])) &&
                    (!this.filtersNew['version'] ||
                        component.version?.toLowerCase().includes(this.filtersNew['version']))
                );
            }
        );
    }

    runScan() {
        this.repoService.runScan(+this.repoId).subscribe({
            next: (response) => {
                this.toastStatus = 'success';
                this.toastMessage = 'Successfully requested a scan';
                this.toggleToast();
                this.loadRepoInfo();
            },
        });
    }

    toggleBulkAction() {
        this.bulkActionMode = !this.bulkActionMode;
        if (!this.bulkActionMode) {
            this.selectedFindings = [];
        }
    }

    onSelectFinding(id: number, event: any) {
        if (event.target.checked) {
            if (!this.selectedFindings.includes(id)) {
                this.selectedFindings.push(id);
            }
        } else {
            this.selectedFindings = this.selectedFindings.filter(
                (findingId) => findingId !== id
            );
        }
    }

    isSelected(id: number): boolean {
        return this.selectedFindings.includes(id);
    }

    selectAllFindings(event: any) {
        if (event.target.checked) {
            this.selectedFindings = this.filteredVulns.map((vuln) => vuln.id);
        } else {
            this.selectedFindings = [];
        }
    }

    suppressSelectedFindings() {
        console.log('Selected Findings IDs:', this.selectedFindings);
        // Implement suppression logic here
        if (this.selectedFindings.length > 0) {
            const suppressReason = 'FALSE_POSITIVE'; // As per your requirement
            this.repoService
                .suppressMultipleFindings(+this.repoId, this.selectedFindings)
                .subscribe({
                    next: (response) => {
                        this.toastStatus = 'success';
                        this.toastMessage = 'Successfully Suppressed selected findings';
                        this.toggleToast();
                        this.loadFindings();
                        // Reset selections
                        this.selectedFindings = [];
                        this.bulkActionMode = false;
                    },
                    error: (error) => {
                        this.toastStatus = 'danger';
                        this.toastMessage = 'Failed to suppress selected findings';
                        this.toggleToast();
                    },
                });
        }
    }

    // Scan Info Filter Methods
    updateScanInfoFilter(event: any) {
        const val = event.target.value.toLowerCase();
        this.scanInfoFilter = val;
        this.applyScanInfoFilter();
    }

    applyScanInfoFilter() {
        this.scanInfosFiltered = this.scanInfos.filter((scanInfo) => {
            return (
                scanInfo.codeRepoBranch.name.toLowerCase().includes(this.scanInfoFilter) ||
                scanInfo.commitId.toLowerCase().includes(this.scanInfoFilter)
            );
        });
    }

    addComment() {
        if (!this.newComment?.trim() || this.isAddingComment || this.selectedRowId === null) {
            return;
        }

        const findingId = this.selectedRowId; // Store in a const to ensure type safety
        this.isAddingComment = true;

        this.repoService.addComment(+this.repoId, findingId, this.newComment.trim())
            .subscribe({
                next: () => {
                    // Refresh the finding details to get updated comments
                    if (findingId !== null) { // Additional check to satisfy TypeScript
                        this.repoService.getFinding(+this.repoId, findingId).subscribe({
                            next: (response) => {
                                this.singleVuln = response;
                                this.newComment = '';
                                this.toastStatus = 'success';
                                this.toastMessage = 'Comment added successfully';
                                this.toggleToast();
                            }
                        });
                    }
                },
                error: (error) => {
                    this.toastStatus = 'danger';
                    this.toastMessage = 'Error adding comment';
                    this.toggleToast();
                },
                complete: () => {
                    this.isAddingComment = false;
                }
            });
    }

    openChangeTeamModal() {
        // Load available teams first
        this.teamService.get().subscribe({
            next: (teams: Team[]) => {
                this.availableTeams = teams.filter(team => team.id !== this.repoData?.team?.id);
                this.changeTeamModalVisible = true;
            },
            error: (error: any) => {
                this.toastStatus = 'danger';
                this.toastMessage = 'Error loading teams';
                this.toggleToast();
            }
        });
    }

    executeTeamChange() {
        if (this.confirmationText === 'accept' && this.selectedNewTeamId) {
            this.repoService.changeTeam(this.repoData.id, this.selectedNewTeamId).subscribe({
                next: () => {
                    this.toastStatus = 'success';
                    this.toastMessage = 'Team changed successfully';
                    this.toggleToast();
                    this.loadRepoInfo();
                },
                error: (error: any) => {
                    this.toastStatus = 'danger';
                    this.toastMessage = error.error?.message || 'Error changing team';
                    this.toggleToast();
                },
                complete: () => {
                    this.confirmationModalVisible = false;
                    this.confirmationText = '';
                    this.selectedNewTeamId = null;
                }
            });
        }
    }
    closeChangeTeamModal() {
        this.changeTeamModalVisible = false;
        this.selectedNewTeamId = null;
    }

    confirmTeamChange() {
        this.changeTeamModalVisible = false;
        this.confirmationModalVisible = true;
    }

    closeConfirmationModal() {
        this.confirmationModalVisible = false;
        this.confirmationText = '';
    }


    /**
     * Clear all filters for vulnerabilities
     */
    clearVulnerabilityFilters(): void {
        this.filters = {
            actions: '',
            name: '',
            location: '',
            source: '',
            status: '',
            severity: '',
            dates: '',
        };
        this.showRemoved = false;
        this.showSuppressed = false;
        this.statusFilter = '';
        this.saveFilterStateToStorage();
        this.applyFilters();
    }

    /**
     * Clear all filters for components
     */
    clearComponentFilters(): void {
        this.filtersNew = {
            group: '',
            name: '',
            version: '',
        };
        this.applyFiltersNew();
    }

    /**
     * Handle refresh data with visual feedback
     */
    refreshData(): void {
        // Show loading feedback
        this.toastStatus = 'info';
        this.toastMessage = 'Refreshing statistics data...';
        this.toggleToast();

        // Reload relevant data
        this.loadFindingStats();
        this.loadSourceStats();
    }

    onFindingSuppressed(): void {
        this.toastStatus = 'success';
        this.toastMessage = 'Successfully Suppressed finding';
        this.toggleToast();
        this.loadFindings();
    }

    runExploitabilityAnalysis() {
        this.scanRunning = true;
        this.exploitService.analyzeRepository(+this.repoId).subscribe({
            next: () => {
                this.toastService.show('Analysis has been started', ToastStatus.Success, 'Analysis start');
            },
            error: (error: any) => {
                this.toastService.show('Analysis has not started correctly', ToastStatus.Success, 'Analysis start');
                this.toastStatus = 'danger';
                this.toastMessage = error.error?.message || 'Error changing team';
                this.toggleToast();
            }
        });
        this.toastService.show('Analysis has been started', ToastStatus.Success, 'Analysis start');
    }
    /**
     * Persist filter/toggle UI state to localStorage for this repo.
     */
    private saveFilterStateToStorage(): void {
        try {
            const payload = {
                filters: this.filters,
                showRemoved: this.showRemoved,
                showSuppressed: this.showSuppressed,
                showUrgent: this.showUrgent,
                showNotable: this.showNotable,
                statusFilter: this.statusFilter,
            };
            localStorage.setItem('repoFilters:' + this.repoId, JSON.stringify(payload));
        } catch {}
    }

    /**
     * Restore filter/toggle UI state from localStorage for this repo.
     */
    private restoreFilterStateFromStorage(): void {
        try {
            const raw = localStorage.getItem('repoFilters:' + this.repoId);
            if (!raw) return;
            const s = JSON.parse(raw);
            if (s && typeof s === 'object') {
                this.filters = { ...this.filters, ...(s.filters || {}) };
                this.showRemoved = !!s.showRemoved;
                this.showSuppressed = !!s.showSuppressed;
                this.showUrgent = !!s.showUrgent;
                this.showNotable = !!s.showNotable;
                this.statusFilter = s.statusFilter || '';
                this.cdr.detectChanges();
            }
        } catch {}
    }
}