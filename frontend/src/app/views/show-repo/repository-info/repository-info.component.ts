import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {
    ButtonCloseDirective,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    FormControlDirective,
    ModalBodyComponent,
    ModalComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ProgressComponent,
    RowComponent,
    SpinnerComponent,
    TooltipDirective,
} from '@coreui/angular';
import {IconDirective} from '@coreui/icons-angular';
import {DatePipe, NgFor, NgIf} from '@angular/common';
import {ChartjsComponent} from "@coreui/angular-chartjs";
import {FormsModule} from "@angular/forms";
import {RepoService} from "../../../service/RepoService";
import {SharedModule} from "../../../shared/shared.module";
import {Chart} from "chart.js";

@Component({
  selector: 'app-repository-info',
  standalone: true,
    imports: [
        RowComponent,
        ColComponent,
        CardComponent,
        CardBodyComponent,
        ButtonDirective,
        IconDirective,
        SpinnerComponent,
        ProgressComponent,
        NgIf,
        NgFor,
        TooltipDirective,
        CardHeaderComponent,
        ChartjsComponent,
        DatePipe,
        ModalComponent,
        ModalHeaderComponent,
        ModalBodyComponent,
        FormControlDirective,
        FormsModule,
        ButtonCloseDirective,
        ModalTitleDirective,
        ModalFooterComponent,
        SharedModule,
    ],
  templateUrl: './repository-info.component.html',
  styleUrls: ['./repository-info.component.scss']
})
export class RepositoryInfoComponent implements OnInit, AfterViewInit  {
    @ViewChild('pieChartRef') pieChart!: ChartjsComponent;
  private chartInstance!: Chart<'pie', number[], unknown>;

  @Input() repoData: any;
  @Input() scanRunning: boolean = false;
  @Input() userRole: string = 'USER';
  @Input() topLanguages: { name: string; value: number; color: string }[] = [];
  @Input() chartPieData: any;
  @Input() options: any = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        bodyFont: {
          size: 13
        },
        padding: 10
      }
    },
    cutout: '60%'
  };

    renameModalVisible = false;
    renameSaving = false;
    renameError: string | null = null;
    renameForm = { name: '' };

  @Output() runScanEvent = new EventEmitter<void>();
  @Output() runExploitabilityEvent = new EventEmitter<void>();
  @Output() openChangeTeamModalEvent = new EventEmitter<void>();
  @Output() updateFilterSource = new EventEmitter<any>();

  ngOnInit(): void {
    // Enhance chart options with better defaults
    this.options = {
      ...this.options,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          bodyFont: {
            size: 13
          },
          padding: 10
        }
      },
      cutout: '60%'
    };
  }

    ngAfterViewInit() {
        setTimeout(() => {
            const chartInstance = (this.pieChart as any)?.chart;

            if (chartInstance && chartInstance.canvas) {
                chartInstance.canvas.addEventListener('click', (evt: MouseEvent) => {
                    const elements = chartInstance.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
                    if (elements.length) {
                        const first = elements[0];
                        const label = chartInstance.data.labels[first.index];
                        const value = chartInstance.data.datasets[first.datasetIndex].data[first.index];
                        console.log('Clicked slice', label, value);
                        this.updateFilterSource.emit({ target: { value: label } });
                    }
                });
            } else {
                console.warn('Chart instance or canvas not available yet');
            }
        }, 0);
    }

  runScan(): void {
    this.runScanEvent.emit();
  }

    constructor(private codeService: RepoService) {}


    openChangeTeamModal(): void {
    this.openChangeTeamModalEvent.emit();
  }

    openRenameModal() {
        this.renameError = null;
        this.renameForm.name = this.repoData?.name ?? '';
        this.renameModalVisible = true;
    }
    confirmRename() {
        const id = this.repoData?.id;
        if (!id) return;

        const trimmed = (this.renameForm.name || '').trim();
        if (!trimmed) {
            this.renameError = 'Name cannot be empty.';
            return;
        }

        // Optional client-side check mirroring backend
        const ok = /^[\p{L}\p{N} _.\-\/]{1,200}$/u.test(trimmed);
        if (!ok) {
            this.renameError = 'Invalid name. Allowed: letters, digits, space, _ . -';
            return;
        }

        this.renameSaving = true;
        this.codeService.rename(id, trimmed).subscribe({
            next: () => {
                if (this.repoData) this.repoData.name = trimmed; // optimistic UI update
                this.renameSaving = false;
                this.renameModalVisible = false;
            },
            error: (err) => {
                this.renameSaving = false;
                this.renameError = err?.error?.message || 'Rename failed.';
            }
        });
    }

  analyzeExploitability() {
    this.runExploitabilityEvent.emit();
  }
}