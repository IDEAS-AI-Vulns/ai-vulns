import {Component, Input} from '@angular/core';
import {ProgressComponent} from "@coreui/angular";
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-language-breakdown',
  templateUrl: './language-breakdown.component.html',
  standalone: true,
  imports: [
    ProgressComponent,
    NgForOf
  ],
  styleUrl: './language-breakdown.component.scss'
})
export class LanguageBreakdownComponent {

  @Input() topLanguages: { name: string; value: number; color: string }[] = [];
}
