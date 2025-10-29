import {Component, inject, Input} from '@angular/core';
import {ButtonDirective, FormLabelDirective} from "@coreui/angular";
import {FormsModule} from "@angular/forms";
import {SettingsService} from "../../../service/SettingsService";
import {ToastService} from "../../../shared/toast/service/toast.service";
import {ToastStatus} from "../../../shared/toast/toast-status";

@Component({
  selector: 'app-other-settings',
  standalone: true,
  imports: [
    ButtonDirective,
    FormsModule,
    FormLabelDirective
  ],
  templateUrl: './other-settings.component.html',
  styleUrl: './other-settings.component.scss'
})
export class OtherSettingsComponent {
  @Input() geminiApiKey: string = '';
  @Input() openaiApiKey: string = '';
  @Input() nistApiKey: string = '';

  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);

  saveOtherConfigurationSettings() {
    this.settingsService.changeOtherConfig({
      geminiApiKey: this.geminiApiKey,
      openaiApiKey: this.openaiApiKey,
      nistApiKey: this.nistApiKey,
    }).subscribe({
      next: () => {
        this.toastService.show("Application configuration updated successfully", ToastStatus.Success);
      },
      error: (error) => {
        this.toastService.show("Failed to update", ToastStatus.Danger);
      }
    });
  }
}
