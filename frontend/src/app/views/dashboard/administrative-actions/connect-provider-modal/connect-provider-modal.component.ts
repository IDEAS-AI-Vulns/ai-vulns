import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {TeamService} from "../../../../service/team/team-service.service";
import {ToastService} from "../../../../service/toast/toast.service";
import {ToastStatus} from "../../../../shared/toast/toast-status";
import {DashboardService} from "../../../../service/DashboardService";

@Component({
  selector: 'app-connect-provider-modal',
  templateUrl: './connect-provider-modal.component.html',
  styleUrl: './connect-provider-modal.component.scss'
})
export class ConnectProviderModalComponent implements OnInit {

  @Input() visible: boolean = false;

  @Output() onFormSubmit = new EventEmitter<any>();

  protected connectProviderForm!: FormGroup;
  protected readonly teamService = inject(TeamService);
  protected readonly toastService = inject(ToastService);
  protected readonly dashboardService = inject(DashboardService);

  constructor(private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.connectProviderForm = this.fb.group({
      providerType: ['GITHUB', Validators.required],
      apiUrl: ['', Validators.required],
      accessToken: ['', Validators.required],
      defaultTeamId: ['', Validators.required]
    });
  }

  protected visibleChange(event: boolean = false) {
    this.visible = event;
  }

  protected onSubmit() {

    if (this.connectProviderForm.valid) {

      this.dashboardService.connectProvider(this.connectProviderForm.value).subscribe({
        next: () => {
          this.toastService.show( "Provider connected successfully. Initial sync has started.", ToastStatus.Success);
          this.visibleChange(false);
        },
        error: (err) => {
          this.toastService.show( `Connection failed: ${err.error.message || 'Please check details and try again.'}`, ToastStatus.Danger);
        }
      });

    } else {
      this.toastService.show( "Please fill all fields for the provider connection.", ToastStatus.Danger);
    }
  }
}
